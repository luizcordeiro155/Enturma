const fs = require("node:fs");
const path = require("node:path");

const project = process.cwd();
const mobile = path.join(project, "apps", "mobile");
const version = require(path.join(mobile, "package.json")).version;
const webOrigin = (process.env.ENTURMA_WEB_URL || "https://enturma-flax.vercel.app").replace(/\/$/, "");

if (!/^https:\/\/[^/]+$/.test(webOrigin)) {
  throw new Error("ENTURMA_WEB_URL precisa ser uma origem HTTPS sem caminho.");
}

const target = path.join(
  mobile,
  "android",
  "app",
  "src",
  "main",
  "java",
  "br",
  "com",
  "enturma",
  "app",
  "MainActivity.kt",
);

fs.mkdirSync(path.dirname(target), { recursive: true });

const source = `package br.com.enturma.app

import android.Manifest
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast

class MainActivity : Activity() {
    companion object {
        private const val FILE_CHOOSER_REQUEST = 4101
        private const val MEDIA_PERMISSION_REQUEST = 4102
        private const val WEB_ORIGIN = "${webOrigin}"
        private const val APP_VERSION = "${version}"
    }

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPermissionRequest: PermissionRequest? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.statusBarColor = Color.parseColor("#0f1917")
        window.navigationBarColor = Color.parseColor("#0f1917")

        CookieManager.getInstance().setAcceptCookie(true)

        webView = WebView(this)
        setContentView(webView)

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.setBackgroundColor(Color.parseColor("#0f1917"))
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            allowFileAccess = false
            allowContentAccess = true
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            builtInZoomControls = false
            displayZoomControls = false
            userAgentString = "${userAgentString} EnturmaMobile/${APP_VERSION}"
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?,
            ): Boolean {
                val uri = request?.url ?: return false
                val origin = Uri.parse(WEB_ORIGIN)
                val sameEnturmaHost =
                    uri.scheme == "https" &&
                    uri.host.equals(origin.host, ignoreCase = true)

                if (sameEnturmaHost || uri.scheme == "about" || uri.scheme == "blob") {
                    return false
                }

                if (uri.scheme == "enturma") {
                    val appPath = uri.path?.takeIf { it.startsWith("/") } ?: "/home"
                    webView.loadUrl("${WEB_ORIGIN}${appPath}")
                    return true
                }

                return openExternal(uri)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest?) {
                if (request == null) return
                runOnUiThread {
                    val missing = mutableListOf<String>()
                    val requested = request.resources.toSet()

                    if (
                        PermissionRequest.RESOURCE_AUDIO_CAPTURE in requested &&
                        checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
                    ) {
                        missing.add(Manifest.permission.RECORD_AUDIO)
                    }

                    if (
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE in requested &&
                        checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED
                    ) {
                        missing.add(Manifest.permission.CAMERA)
                    }

                    if (missing.isEmpty()) {
                        grantAvailableMedia(request)
                    } else {
                        pendingPermissionRequest?.deny()
                        pendingPermissionRequest = request
                        requestPermissions(
                            missing.distinct().toTypedArray(),
                            MEDIA_PERMISSION_REQUEST,
                        )
                    }
                }
            }

            override fun onPermissionRequestCanceled(request: PermissionRequest?) {
                if (pendingPermissionRequest === request) {
                    pendingPermissionRequest = null
                }
            }

            override fun onShowFileChooser(
                view: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?,
            ): Boolean {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = callback

                return try {
                    val intent = params?.createIntent()
                        ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                            type = "*/*"
                            addCategory(Intent.CATEGORY_OPENABLE)
                        }
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST)
                    true
                } catch (_: ActivityNotFoundException) {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = null
                    Toast.makeText(
                        this@MainActivity,
                        "Nenhum seletor de arquivos foi encontrado.",
                        Toast.LENGTH_SHORT,
                    ).show()
                    false
                }
            }
        }

        webView.setDownloadListener { url, _, _, _, _ ->
            runCatching {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            }.onFailure {
                Toast.makeText(
                    this,
                    "Não foi possível abrir este download.",
                    Toast.LENGTH_SHORT,
                ).show()
            }
        }

        if (savedInstanceState == null) {
            webView.loadUrl("${WEB_ORIGIN}/home")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    private fun grantAvailableMedia(request: PermissionRequest) {
        val granted = request.resources.filter { resource ->
            when (resource) {
                PermissionRequest.RESOURCE_AUDIO_CAPTURE ->
                    checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

                PermissionRequest.RESOURCE_VIDEO_CAPTURE ->
                    checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

                else -> false
            }
        }

        if (granted.isEmpty()) request.deny()
        else request.grant(granted.toTypedArray())
    }

    private fun openExternal(uri: Uri): Boolean {
        return try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
            true
        } catch (_: Exception) {
            Toast.makeText(
                this,
                "Não foi possível abrir este link.",
                Toast.LENGTH_SHORT,
            ).show()
            true
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == MEDIA_PERMISSION_REQUEST) {
            val request = pendingPermissionRequest
            pendingPermissionRequest = null
            if (request != null) grantAvailableMedia(request)
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
    ) {
        super.onActivityResult(requestCode, resultCode, data)

        if (requestCode == FILE_CHOOSER_REQUEST) {
            val callback = fileChooserCallback
            fileChooserCallback = null
            callback?.onReceiveValue(
                WebChromeClient.FileChooserParams.parseResult(resultCode, data),
            )
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onDestroy() {
        pendingPermissionRequest?.deny()
        pendingPermissionRequest = null
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null

        if (::webView.isInitialized) {
            webView.stopLoading()
            webView.webChromeClient = null
            webView.webViewClient = WebViewClient()
            webView.destroy()
        }

        super.onDestroy()
    }
}
`;

fs.writeFileSync(target, source, "utf8");
console.log(`Enturma Android Web shell instalado em ${target}`);
console.log(`Origem Web: ${webOrigin} | Versão: ${version}`);
