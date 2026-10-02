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
import android.app.AlarmManager
import android.app.DownloadManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private const val ANDROID_UPDATE_ORIGIN =
    "https://enturma-android-download-v3-production.up.railway.app"
private const val UPDATE_CHANNEL_ID = "enturma_app_updates"
private const val UPDATE_NOTIFICATION_ID = 4801
private const val UPDATE_ALARM_REQUEST = 4802

private fun isNewerVersion(remote: String, current: String): Boolean {
    val a = remote.split(".").map { it.toIntOrNull() ?: 0 }
    val b = current.split(".").map { it.toIntOrNull() ?: 0 }
    val size = maxOf(a.size, b.size)
    for (i in 0 until size) {
        val av = a.getOrElse(i) { 0 }
        val bv = b.getOrElse(i) { 0 }
        if (av != bv) return av > bv
    }
    return false
}

private object EnturmaUpdateScheduler {
    fun schedule(context: Context) {
        val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, EnturmaUpdateReceiver::class.java)
        val pending = PendingIntent.getBroadcast(
            context,
            UPDATE_ALARM_REQUEST,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        alarm.setInexactRepeating(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + 2 * 60 * 1000,
            AlarmManager.INTERVAL_HOUR,
            pending,
        )
    }

    fun checkNow(context: Context) {
        context.sendBroadcast(Intent(context, EnturmaUpdateReceiver::class.java))
    }
}

class EnturmaBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        EnturmaUpdateScheduler.schedule(context)
        EnturmaUpdateScheduler.checkNow(context)
    }
}

class EnturmaUpdateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val async = goAsync()
        Thread {
            try {
                val connection =
                    URL("${ANDROID_UPDATE_ORIGIN}/latest-android.json?ts=${System.currentTimeMillis()}")
                        .openConnection() as HttpURLConnection
                connection.connectTimeout = 8000
                connection.readTimeout = 8000
                connection.setRequestProperty(
                    "User-Agent",
                    "EnturmaMobile/${BuildConfig.VERSION_NAME}",
                )
                connection.setRequestProperty("Cache-Control", "no-cache")
                if (connection.responseCode !in 200..299) return@Thread

                val body = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(body)
                val remote = json.optString("version")
                val downloadUrl = json.optString("downloadUrl")
                if (
                    !remote.matches(Regex("\\d+\\.\\d+\\.\\d+")) ||
                    !downloadUrl.startsWith("${ANDROID_UPDATE_ORIGIN}/") ||
                    !isNewerVersion(remote, BuildConfig.VERSION_NAME)
                ) return@Thread

                if (
                    Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
                        PackageManager.PERMISSION_GRANTED
                ) return@Thread

                val manager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    manager.createNotificationChannel(
                        NotificationChannel(
                            UPDATE_CHANNEL_ID,
                            "Atualizações do Enturma",
                            NotificationManager.IMPORTANCE_HIGH,
                        ).apply {
                            description =
                                "Avisa quando uma nova versão do Enturma está pronta."
                        },
                    )
                }

                val open = Intent(context, MainActivity::class.java).apply {
                    action = Intent.ACTION_VIEW
                    data = Uri.parse("enturma:///settings?update=1")
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val pending = PendingIntent.getActivity(
                    context,
                    remote.hashCode(),
                    open,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
                val builder =
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        Notification.Builder(context, UPDATE_CHANNEL_ID)
                    else Notification.Builder(context)

                val notification = builder
                    .setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentTitle("Nova atualização do Enturma")
                    .setContentText("Versão ${remote} disponível. Toque para atualizar.")
                    .setContentIntent(pending)
                    .setAutoCancel(true)
                    .setOnlyAlertOnce(true)
                    .build()

                manager.notify(UPDATE_NOTIFICATION_ID, notification)
            } catch (_: Exception) {
                // A próxima verificação tenta novamente.
            } finally {
                async.finish()
            }
        }.start()
    }
}

class MainActivity : Activity() {
    companion object {
        private const val FILE_CHOOSER_REQUEST = 4101
        private const val MEDIA_PERMISSION_REQUEST = 4102
        private const val NOTIFICATION_PERMISSION_REQUEST = 4103
        private const val WEB_ORIGIN = "${webOrigin}"
        private const val APP_VERSION = "${version}"
    }

    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPermissionRequest: PermissionRequest? = null
    private var safeTopCssPx = 0
    private var safeRightCssPx = 0
    private var safeBottomCssPx = 0
    private var safeLeftCssPx = 0
    private var updateDownloadId: Long? = null
    private var updateReceiverRegistered = false
    private var pendingUpdateUrl: String? = null

    private val updateDownloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return
            val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
            if (id <= 0 || id != updateDownloadId) return

            val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val uri = manager.getUriForDownloadedFile(id)
            if (uri == null) {
                Toast.makeText(
                    this@MainActivity,
                    "Não foi possível concluir a atualização.",
                    Toast.LENGTH_LONG,
                ).show()
                return
            }

            runCatching {
                startActivity(
                    Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(uri, "application/vnd.android.package-archive")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    },
                )
            }.onFailure {
                Toast.makeText(
                    this@MainActivity,
                    "Abra o download concluído para instalar a atualização.",
                    Toast.LENGTH_LONG,
                ).show()
            }
        }
    }

    private inner class EnturmaNativeBridge {
        @JavascriptInterface
        fun setLightTheme(light: Boolean) {
            runOnUiThread {
                applySystemBarTheme(light)
            }
        }

        @JavascriptInterface
        fun installUpdate(downloadUrl: String) {
            runOnUiThread {
                startUpdateInstall(downloadUrl)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        CookieManager.getInstance().setAcceptCookie(true)

        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#0f1917"))
        setContentView(webView)

        applySystemBarTheme(false)
        webView.addJavascriptInterface(EnturmaNativeBridge(), "EnturmaNative")
        registerUpdateDownloadReceiver()
        EnturmaUpdateScheduler.schedule(this)
        EnturmaUpdateScheduler.checkNow(this)

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                NOTIFICATION_PERMISSION_REQUEST,
            )
        }

        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            val safeInsets = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                    WindowInsetsCompat.Type.navigationBars() or
                    WindowInsetsCompat.Type.displayCutout(),
            )
            val density = resources.displayMetrics.density.takeIf { it > 0f } ?: 1f
            safeTopCssPx = (safeInsets.top / density).toInt()
            safeRightCssPx = (safeInsets.right / density).toInt()
            safeBottomCssPx = (safeInsets.bottom / density).toInt()
            safeLeftCssPx = (safeInsets.left / density).toInt()
            syncSafeAreaCss()
            insets
        }
        ViewCompat.requestApplyInsets(webView)

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
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
            userAgentString = "\${userAgentString} EnturmaMobile/\${APP_VERSION}"
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                syncSafeAreaCss()
            }

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
                    webView.loadUrl("\${WEB_ORIGIN}\${appPath}")
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
            webView.loadUrl("\${WEB_ORIGIN}\${routeFromIntent(intent) ?: "/home"}")
        } else {
            webView.restoreState(savedInstanceState)
        }
    }

    override fun onResume() {
        super.onResume()
        EnturmaUpdateScheduler.checkNow(this)
        val pending = pendingUpdateUrl
        if (
            pending != null &&
            (Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
                packageManager.canRequestPackageInstalls())
        ) {
            pendingUpdateUrl = null
            startUpdateInstall(pending)
        }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        val route = routeFromIntent(intent) ?: return
        if (::webView.isInitialized) webView.loadUrl("\${WEB_ORIGIN}\${route}")
    }

    private fun routeFromIntent(intent: Intent?): String? {
        val uri = intent?.data ?: return null
        if (uri.scheme != "enturma") return null
        val path = uri.path?.takeIf { it.startsWith("/") } ?: return null
        val query = uri.encodedQuery?.let { "?\${it}" } ?: ""
        return "\${path}\${query}"
    }

    private fun registerUpdateDownloadReceiver() {
        if (updateReceiverRegistered) return
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(updateDownloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(updateDownloadReceiver, filter)
        }
        updateReceiverRegistered = true
    }

    private fun startUpdateInstall(downloadUrl: String) {
        val uri = runCatching { Uri.parse(downloadUrl) }.getOrNull() ?: return
        val expected = Uri.parse(ANDROID_UPDATE_ORIGIN)
        val valid =
            uri.scheme == "https" &&
                uri.host.equals(expected.host, ignoreCase = true) &&
                uri.path?.endsWith(".apk") == true
        if (!valid) {
            Toast.makeText(this, "Atualização inválida.", Toast.LENGTH_SHORT).show()
            return
        }

        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !packageManager.canRequestPackageInstalls()
        ) {
            pendingUpdateUrl = downloadUrl
            startActivity(
                Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:\${packageName}"),
                ),
            )
            Toast.makeText(
                this,
                "Permita instalar atualizações do Enturma e volte ao aplicativo.",
                Toast.LENGTH_LONG,
            ).show()
            return
        }

        val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        updateDownloadId = manager.enqueue(
            DownloadManager.Request(uri)
                .setTitle("Atualização do Enturma")
                .setDescription("Baixando a nova versão do aplicativo")
                .setMimeType("application/vnd.android.package-archive")
                .setNotificationVisibility(
                    DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED,
                ),
        )
        Toast.makeText(
            this,
            "Atualização iniciada. O Android abrirá a instalação quando terminar.",
            Toast.LENGTH_LONG,
        ).show()
    }

    private fun applySystemBarTheme(light: Boolean) {
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
    }

    private fun syncSafeAreaCss() {
        if (!::webView.isInitialized) return

        val script = """
            (function() {
              var root = document.documentElement;
              if (!root) return;

              root.dataset.enturmaMobile = "true";
              root.style.setProperty("--native-safe-top", "\${safeTopCssPx}px");
              root.style.setProperty("--native-safe-right", "\${safeRightCssPx}px");
              root.style.setProperty("--native-safe-bottom", "\${safeBottomCssPx}px");
              root.style.setProperty("--native-safe-left", "\${safeLeftCssPx}px");

              var styleId = "enturma-native-safe-area";
              var style = document.getElementById(styleId);
              if (!style) {
                style = document.createElement("style");
                style.id = styleId;
                (document.head || root).appendChild(style);
              }

              style.textContent = [
                'html[data-enturma-mobile="true"] .topbar {',
                '  box-sizing: border-box !important;',
                '  padding-top: calc(10px + var(--native-safe-top, 0px)) !important;',
                '  min-height: calc(68px + var(--native-safe-top, 0px)) !important;',
                '}',
                '@media (max-width: 760px) {',
                '  html[data-enturma-mobile="true"] .topbar {',
                '    min-height: calc(58px + var(--native-safe-top, 0px)) !important;',
                '  }',
                '}'
              ].join("\\n");

              function syncNativeTheme() {
                var theme = root.dataset.theme || "light";
                var light = theme !== "dark";
                if (theme === "system" && window.matchMedia) {
                  light = !window.matchMedia("(prefers-color-scheme: dark)").matches;
                }
                try {
                  if (window.EnturmaNative && typeof window.EnturmaNative.setLightTheme === "function") {
                    window.EnturmaNative.setLightTheme(light);
                  }
                } catch (_) {}
              }

              syncNativeTheme();

              if (window.__enturmaThemeObserver) {
                window.__enturmaThemeObserver.disconnect();
              }
              window.__enturmaThemeObserver = new MutationObserver(function(mutations) {
                for (var i = 0; i < mutations.length; i++) {
                  if (mutations[i].attributeName === "data-theme") {
                    syncNativeTheme();
                    break;
                  }
                }
              });
              window.__enturmaThemeObserver.observe(root, {
                attributes: true,
                attributeFilter: ["data-theme"]
              });
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
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
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST) {
            EnturmaUpdateScheduler.checkNow(this)
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

        if (updateReceiverRegistered) {
            runCatching { unregisterReceiver(updateDownloadReceiver) }
            updateReceiverRegistered = false
        }

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
