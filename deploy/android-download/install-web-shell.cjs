const fs = require("node:fs");
const path = require("node:path");

const project = process.cwd();
const mobile = path.join(project, "apps", "mobile");
const version = require(path.join(mobile, "package.json")).version;
const webOrigin = (
  process.env.ENTURMA_WEB_URL || "https://enturma-flax.vercel.app"
).replace(/\/$/, "");
const firebaseProjectId = process.env.FIREBASE_ANDROID_PROJECT_ID || "";
const firebaseAppId = process.env.FIREBASE_ANDROID_APP_ID || "";
const firebaseApiKey = process.env.FIREBASE_ANDROID_API_KEY || "";
const firebaseSenderId = process.env.FIREBASE_ANDROID_SENDER_ID || "";
const kotlinString = (value) => JSON.stringify(String(value));

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
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.widget.FrameLayout
import android.webkit.CookieManager
import android.content.pm.ActivityInfo
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.GeolocationPermissions
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import android.app.Person
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.drawable.Icon
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONArray
import java.io.File
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

private const val ANDROID_UPDATE_ORIGIN =
    "https://enturma-android-download-v3-production.up.railway.app"
private const val UPDATE_CHANNEL_ID = "enturma_app_updates"
private const val UPDATE_NOTIFICATION_ID = 4801
private const val UPDATE_ALARM_REQUEST = 4802
private const val UPDATE_ACTION_INSTALL = "br.com.enturma.app.action.INSTALL_UPDATE"
private const val UPDATE_ACTION_SETTINGS = "br.com.enturma.app.action.OPEN_UPDATE_SETTINGS"
private const val UPDATE_ACTION_OPEN_INSTALLER = "br.com.enturma.app.action.OPEN_DOWNLOADED_UPDATE"
private const val UPDATE_EXTRA_URL = "downloadUrl"
private const val UPDATE_EXTRA_DOWNLOAD_ID = "downloadId"
private const val PUSH_ACTION_OPEN = "br.com.enturma.app.action.OPEN_PUSH"
private const val PUSH_EXTRA_HREF = "href"
private const val PUSH_CHANNEL_ID = "enturma_social"
private const val PUSH_PREFS = "enturma_push_state"
private const val PREF_PUSH_INSTALLATION_ID = "installation_id"
private const val PREF_PUSH_TOKEN = "push_token"
private const val PUSH_EXTRA_CONVERSATION = "conversation"
private const val NOTIFICATION_WEB_ORIGIN = ${kotlinString(webOrigin)}
private const val PRIVATE_KEYS_PREFS = "enturma_private_notification_keys"
private const val PREF_PRIVATE_KEYS_BLOB = "blob"
private const val NOTIFICATION_VAULT_ALIAS = "enturma_private_notification_keys_v1"
private const val MESSAGE_HISTORY_PREFS = "enturma_message_notifications"
private const val MESSAGE_GROUP = "br.com.enturma.app.MESSAGES"
private const val MESSAGE_SUMMARY_ID = 4810
private const val MESSAGE_HISTORY_LIMIT = 8
private const val MESSAGE_HISTORY_MAX_AGE_MS = 86_400_000L
private val UUID_PATTERN = Regex("^[0-9a-fA-F-]{36}$")
private const val FIREBASE_PROJECT_ID = ${kotlinString(firebaseProjectId)}
private const val FIREBASE_APP_ID = ${kotlinString(firebaseAppId)}
private const val FIREBASE_API_KEY = ${kotlinString(firebaseApiKey)}
private const val FIREBASE_SENDER_ID = ${kotlinString(firebaseSenderId)}
private const val UPDATE_PREFS = "enturma_update_state"
private const val PREF_NOTIFIED_VERSION = "notified_version"
private const val PREF_DOWNLOAD_ID = "download_id"
private const val PREF_DOWNLOAD_URL = "download_url"
private const val PREF_DOWNLOAD_BASE_VERSION = "download_base_version"
private const val PREF_INSTALL_PROMPTED_ID = "install_prompted_id"
private const val PREF_INSTALL_PROMPTED_AT = "install_prompted_at"
private const val UPDATE_RELAUNCH_REQUEST = 4804
private const val INSTALLER_DEDUP_MS = 1500L

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


private object EnturmaAppState {
    @Volatile var foreground = false
}

private fun safePushHref(value: String?): String {
    val href = value?.takeIf {
        it.startsWith("/") && !it.startsWith("//") && it.length <= 300
    }
    return href ?: "/notifications"
}

private fun pushInstallationId(context: Context): String {
    val prefs = context.getSharedPreferences(PUSH_PREFS, Context.MODE_PRIVATE)
    val existing = prefs.getString(PREF_PUSH_INSTALLATION_ID, null)
    if (!existing.isNullOrBlank()) return existing
    val created = UUID.randomUUID().toString()
    prefs.edit().putString(PREF_PUSH_INSTALLATION_ID, created).apply()
    return created
}

private fun initializeFirebase(context: Context): Boolean {
    if (
        FIREBASE_PROJECT_ID.isBlank() ||
        FIREBASE_APP_ID.isBlank() ||
        FIREBASE_API_KEY.isBlank() ||
        FIREBASE_SENDER_ID.isBlank()
    ) return false

    return runCatching {
        if (FirebaseApp.getApps(context).isEmpty()) {
            FirebaseApp.initializeApp(
                context,
                FirebaseOptions.Builder()
                    .setProjectId(FIREBASE_PROJECT_ID)
                    .setApplicationId(FIREBASE_APP_ID)
                    .setApiKey(FIREBASE_API_KEY)
                    .setGcmSenderId(FIREBASE_SENDER_ID)
                    .build(),
            )
        }
        FirebaseMessaging.getInstance().isAutoInitEnabled = true
        true
    }.getOrDefault(false)
}

private fun storePushToken(context: Context, token: String) {
    if (token.isBlank()) return
    context.getSharedPreferences(PUSH_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(PREF_PUSH_TOKEN, token)
        .apply()
}

private fun ensurePushNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
        NotificationChannel(
            PUSH_CHANNEL_ID,
            "Mensagens e atividades",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description =
                "Mensagens, menções, respostas do fórum e outras atividades escolhidas pelo usuário."
        },
    )
}

/**
 * Private messages are end-to-end encrypted. The page hands this app each
 * conversation's key (kept encrypted under the Android Keystore), so the phone
 * decrypts a message notification itself and stacks the messages of each person
 * in one notification, like WhatsApp. The server never has the text.
 */
private object EnturmaPrivateNotifications {
    private fun keystoreKey(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(NOTIFICATION_VAULT_ALIAS, null) as? SecretKey)?.let { return it }
        val generator =
            KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        generator.init(
            KeyGenParameterSpec.Builder(
                NOTIFICATION_VAULT_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build(),
        )
        return generator.generateKey()
    }

    fun store(context: Context, json: String) {
        val incoming = JSONObject(json)
        val user = incoming.optString("user")
        val keys = incoming.optJSONObject("keys") ?: return
        if (!UUID_PATTERN.matches(user) || keys.length() > 500) return
        val clean = JSONObject()
        val names = keys.keys()
        while (names.hasNext()) {
            val id = names.next()
            val value = keys.optString(id)
            if (!UUID_PATTERN.matches(id)) continue
            val raw = runCatching { Base64.decode(value, Base64.DEFAULT) }.getOrNull() ?: continue
            if (raw.size != 32) continue
            clean.put(id, value)
        }
        val payload = JSONObject().put("user", user).put("keys", clean).toString()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, keystoreKey())
        val sealed = cipher.doFinal(payload.toByteArray(Charsets.UTF_8))
        val blob =
            Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + "." +
                Base64.encodeToString(sealed, Base64.NO_WRAP)
        context.getSharedPreferences(PRIVATE_KEYS_PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(PREF_PRIVATE_KEYS_BLOB, blob)
            .apply()
    }

    private fun keys(context: Context): JSONObject? {
        val blob = context.getSharedPreferences(PRIVATE_KEYS_PREFS, Context.MODE_PRIVATE)
            .getString(PREF_PRIVATE_KEYS_BLOB, null) ?: return null
        val parts = blob.split(".")
        if (parts.size != 2) return null
        return runCatching {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(
                Cipher.DECRYPT_MODE,
                keystoreKey(),
                GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)),
            )
            JSONObject(
                String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), Charsets.UTF_8),
            )
        }.getOrNull()
    }

    /** Same scheme as the web app: AES-256-GCM, additional data "conversation:sender:client". */
    private fun decrypt(context: Context, data: Map<String, String>): String? {
        val conversation = data["conversation"] ?: return null
        val ciphertext = data["ciphertext"] ?: return null
        val iv = data["iv"] ?: return null
        val sender = data["senderId"] ?: return null
        val client = data["clientId"] ?: return null
        val raw = keys(context)?.optJSONObject("keys")?.optString(conversation)
            ?.takeIf { it.isNotBlank() } ?: return null
        return runCatching {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(
                Cipher.DECRYPT_MODE,
                SecretKeySpec(Base64.decode(raw, Base64.DEFAULT), "AES"),
                GCMParameterSpec(128, Base64.decode(iv, Base64.DEFAULT)),
            )
            cipher.updateAAD((conversation + ":" + sender + ":" + client).toByteArray(Charsets.UTF_8))
            String(cipher.doFinal(Base64.decode(ciphertext, Base64.DEFAULT)), Charsets.UTF_8)
        }.getOrNull()?.trim()?.takeIf { it.isNotEmpty() }
    }

    private fun line(data: Map<String, String>, text: String?): String {
        if (!text.isNullOrBlank()) return text.take(400)
        val mime = data["attachmentMime"] ?: ""
        return when {
            data["mediaKind"] == "STICKER" -> "Figurinha"
            data["mediaKind"] == "GIF" -> "GIF"
            mime.startsWith("audio/") -> "Mensagem de voz"
            mime.startsWith("image/") -> "Imagem"
            else -> "Nova mensagem"
        }
    }

    fun notificationId(conversation: String): Int = ("message:" + conversation).hashCode()

    private fun remember(context: Context, conversation: String, entry: JSONObject): JSONArray {
        val prefs = context.getSharedPreferences(MESSAGE_HISTORY_PREFS, Context.MODE_PRIVATE)
        val history = runCatching { JSONArray(prefs.getString(conversation, "[]")) }
            .getOrDefault(JSONArray())
        val id = entry.optString("id")
        val now = System.currentTimeMillis()
        val kept = JSONArray()
        for (i in 0 until history.length()) {
            val item = history.optJSONObject(i) ?: continue
            if (item.optString("id") == id) continue
            if (now - item.optLong("at") > MESSAGE_HISTORY_MAX_AGE_MS) continue
            kept.put(item)
        }
        kept.put(entry)
        val trimmed = JSONArray()
        for (i in maxOf(0, kept.length() - MESSAGE_HISTORY_LIMIT) until kept.length())
            trimmed.put(kept.get(i))
        prefs.edit().putString(conversation, trimmed.toString()).apply()
        return trimmed
    }

    private fun circle(source: Bitmap): Bitmap {
        val size = minOf(source.width, source.height)
        val output = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint)
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        val left = (source.width - size) / 2
        val top = (source.height - size) / 2
        canvas.drawBitmap(source, Rect(left, top, left + size, top + size), Rect(0, 0, size, size), paint)
        return output
    }

    private fun avatar(context: Context, sender: String?): Bitmap? {
        if (sender == null || !UUID_PATTERN.matches(sender)) return null
        val folder = File(context.cacheDir, "notification-avatars").apply { mkdirs() }
        val file = File(folder, sender + ".png")
        if (file.exists() && System.currentTimeMillis() - file.lastModified() < 86_400_000L)
            BitmapFactory.decodeFile(file.absolutePath)?.let { return it }
        val downloaded = runCatching {
            val connection =
                URL(NOTIFICATION_WEB_ORIGIN + "/api/backend/users/" + sender + "/avatar").openConnection()
                    as HttpURLConnection
            connection.connectTimeout = 5000
            connection.readTimeout = 5000
            CookieManager.getInstance().getCookie(NOTIFICATION_WEB_ORIGIN)?.let {
                connection.setRequestProperty("Cookie", it)
            }
            try {
                if (connection.responseCode !in 200..299) null
                else connection.inputStream.use { BitmapFactory.decodeStream(it) }
            } finally {
                connection.disconnect()
            }
        }.getOrNull() ?: return null
        val round = circle(downloaded)
        runCatching { file.outputStream().use { round.compress(Bitmap.CompressFormat.PNG, 100, it) } }
        return round
    }

    private fun builder(context: Context): Notification.Builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            Notification.Builder(context, PUSH_CHANNEL_ID)
        else Notification.Builder(context)

    fun show(context: Context, data: Map<String, String>, open: PendingIntent) {
        val conversation = data["conversation"] ?: return
        val senderName = data["senderName"]?.take(80)?.takeIf { it.isNotBlank() } ?: "Enturma"
        val text = line(data, decrypt(context, data))
        val at = data["sentAt"]?.toLongOrNull() ?: System.currentTimeMillis()
        val history = remember(
            context,
            conversation,
            JSONObject()
                .put("id", data["messageId"] ?: UUID.randomUUID().toString())
                .put("text", text)
                .put("at", at),
        )
        val photo = avatar(context, data["senderId"])
        // The lock screen only shows the text if the person allows sensitive content.
        val hidden = builder(context)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle("Enturma")
            .setContentText("Nova mensagem")
            .build()
        val notification = builder(context)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(senderName)
            .setContentText(text)
            .setNumber(history.length())
            .setWhen(at)
            .setShowWhen(true)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setGroup(MESSAGE_GROUP)
            .setCategory(Notification.CATEGORY_MESSAGE)
            .setVisibility(Notification.VISIBILITY_PRIVATE)
            .setPublicVersion(hidden)
        if (photo != null) notification.setLargeIcon(photo)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val sender = Person.Builder().setName(senderName).setKey(data["senderId"])
            if (photo != null) sender.setIcon(Icon.createWithBitmap(photo))
            val person = sender.build()
            val style = Notification.MessagingStyle(Person.Builder().setName("Você").build())
            for (i in 0 until history.length()) {
                val item = history.optJSONObject(i) ?: continue
                style.addMessage(
                    Notification.MessagingStyle.Message(item.optString("text"), item.optLong("at"), person),
                )
            }
            notification.setStyle(style)
        } else {
            val style = Notification.InboxStyle()
            for (i in 0 until history.length())
                style.addLine(history.optJSONObject(i)?.optString("text") ?: "")
            notification.setStyle(style)
        }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationId(conversation), notification.build())
        updateSummary(context)
    }

    private fun updateSummary(context: Context) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val prefs = context.getSharedPreferences(MESSAGE_HISTORY_PREFS, Context.MODE_PRIVATE)
        val conversations = prefs.all
        if (conversations.size < 2) {
            manager.cancel(MESSAGE_SUMMARY_ID)
            return
        }
        var messages = 0
        for (value in conversations.values)
            messages += runCatching { JSONArray(value as String).length() }.getOrDefault(0)
        val summary = builder(context)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle("Enturma")
            .setContentText(messages.toString() + " mensagens de " + conversations.size + " conversas")
            .setGroup(MESSAGE_GROUP)
            .setGroupSummary(true)
            .setAutoCancel(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            summary.setGroupAlertBehavior(Notification.GROUP_ALERT_CHILDREN)
        manager.notify(MESSAGE_SUMMARY_ID, summary.build())
    }

    /** The conversation was opened: its stacked notification is done. */
    fun forget(context: Context, conversation: String) {
        context.getSharedPreferences(MESSAGE_HISTORY_PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(conversation)
            .apply()
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(notificationId(conversation))
        updateSummary(context)
    }

    /** Signing out: no keys, texts or message notifications stay on the phone. */
    fun clear(context: Context) {
        val history = context.getSharedPreferences(MESSAGE_HISTORY_PREFS, Context.MODE_PRIVATE)
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        for (conversation in history.all.keys) manager.cancel(notificationId(conversation))
        manager.cancel(MESSAGE_SUMMARY_ID)
        history.edit().clear().apply()
        context.getSharedPreferences(PRIVATE_KEYS_PREFS, Context.MODE_PRIVATE).edit().clear().apply()
    }
}

class EnturmaMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        storePushToken(this, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val showInForeground =
            message.data["showInForeground"].equals("true", ignoreCase = true)
        if (EnturmaAppState.foreground && !showInForeground) return
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
        ) return

        val data = message.data
        val title = data["title"]?.take(120) ?: "Enturma"
        val body = data["body"]?.take(240) ?: "Você tem uma nova notificação."
        val href = safePushHref(data["href"])
        ensurePushNotificationChannel(this)

        val conversation = data["conversation"]?.takeIf { UUID_PATTERN.matches(it) }
        val open = Intent(this, MainActivity::class.java).apply {
            action = PUSH_ACTION_OPEN
            putExtra(PUSH_EXTRA_HREF, href)
            if (conversation != null) putExtra(PUSH_EXTRA_CONVERSATION, conversation)
            flags =
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val requestCode =
            if (conversation != null) EnturmaPrivateNotifications.notificationId(conversation)
            else (data["notificationId"] ?: href + body).hashCode()
        val pending = PendingIntent.getActivity(
            this,
            requestCode,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val kind = data["kind"]
        if (conversation != null && (kind == "PRIVATE_MESSAGE" || kind == "MENTION")) {
            EnturmaPrivateNotifications.show(this, data, pending)
            return
        }
        val builder =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                Notification.Builder(this, PUSH_CHANNEL_ID)
            else Notification.Builder(this)

        val notification = builder
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(Notification.BigTextStyle().bigText(body))
            .setContentIntent(pending)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .build()

        val manager =
            getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(requestCode, notification)
    }
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
            AlarmManager.INTERVAL_FIFTEEN_MINUTES,
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
        val pendingResult = goAsync()
        Thread {
            try {
                val connection =
                    (URL(ANDROID_UPDATE_ORIGIN + "/latest-android.json?ts=" + System.currentTimeMillis())
                        .openConnection() as HttpURLConnection).apply {
                        connectTimeout = 7000
                        readTimeout = 7000
                        requestMethod = "GET"
                        useCaches = false
                    }
                try {
                    if (connection.responseCode !in 200..299) return@Thread
                    val payload = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(payload)
                    val version = json.optString("version", "")
                    val downloadUrl = json.optString("downloadUrl", "")
                    val uri = runCatching { Uri.parse(downloadUrl) }.getOrNull() ?: return@Thread
                    val origin = Uri.parse(ANDROID_UPDATE_ORIGIN)
                    if (
                        !version.matches(Regex("^[0-9]+[.][0-9]+[.][0-9]+$")) ||
                        !isNewerVersion(version, BuildConfig.VERSION_NAME) ||
                        uri.scheme != "https" ||
                        !uri.host.equals(origin.host, ignoreCase = true) ||
                        uri.path?.endsWith(".apk") != true
                    ) return@Thread

                    val prefs = context.getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
                    if (prefs.getString(PREF_NOTIFIED_VERSION, null) == version) return@Thread

                    if (
                        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
                            PackageManager.PERMISSION_GRANTED
                    ) return@Thread

                    ensureUpdateNotificationChannel(context)

                    val open = Intent(context, MainActivity::class.java).apply {
                        action = UPDATE_ACTION_SETTINGS
                        flags =
                            Intent.FLAG_ACTIVITY_NEW_TASK or
                                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    val openPending = PendingIntent.getActivity(
                        context,
                        UPDATE_NOTIFICATION_ID,
                        open,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                    )
                    val builder =
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                            Notification.Builder(context, UPDATE_CHANNEL_ID)
                        else Notification.Builder(context)

                    val notification = builder
                        .setSmallIcon(android.R.drawable.stat_sys_download_done)
                        .setContentTitle("Atualização do Enturma disponível")
                        .setContentText("Versão " + version + " pronta. Toque para atualizar.")
                        .setStyle(
                            Notification.BigTextStyle().bigText(
                                "A versão " + version +
                                    " do Enturma está disponível. Toque para abrir Configurações e iniciar a atualização.",
                            ),
                        )
                        .setContentIntent(openPending)
                        .setAutoCancel(true)
                        .setOnlyAlertOnce(true)
                        .build()

                    val manager =
                        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                    manager.notify(UPDATE_NOTIFICATION_ID, notification)
                    prefs.edit().putString(PREF_NOTIFIED_VERSION, version).apply()
                } finally {
                    connection.disconnect()
                }
            } catch (_: Exception) {
                // A próxima verificação agendada tenta novamente.
            } finally {
                pendingResult.finish()
            }
        }.start()
    }
}


private fun downloadedApkUri(context: Context, downloadId: Long): Uri? {
    if (downloadId <= 0) return null
    val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val cursor = manager.query(DownloadManager.Query().setFilterById(downloadId))
    cursor.use {
        if (!it.moveToFirst()) return null
        val statusColumn = it.getColumnIndex(DownloadManager.COLUMN_STATUS)
        if (
            statusColumn < 0 ||
            it.getInt(statusColumn) != DownloadManager.STATUS_SUCCESSFUL
        ) return null
    }
    return manager.getUriForDownloadedFile(downloadId)
}

private fun ensureUpdateNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.createNotificationChannel(
        NotificationChannel(
            UPDATE_CHANNEL_ID,
            "Atualizações do Enturma",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Avisa quando uma nova versão do Enturma está pronta."
        },
    )
}

private fun showInstallReadyNotification(context: Context, downloadId: Long) {
    if (
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
        context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
    ) return

    ensureUpdateNotificationChannel(context)

    val open = Intent(context, MainActivity::class.java).apply {
        action = UPDATE_ACTION_OPEN_INSTALLER
        putExtra(UPDATE_EXTRA_DOWNLOAD_ID, downloadId)
        flags =
            Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val pending = PendingIntent.getActivity(
        context,
        UPDATE_NOTIFICATION_ID,
        open,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            Notification.Builder(context, UPDATE_CHANNEL_ID)
        else Notification.Builder(context)

    val installAction =
        Notification.Action.Builder(
            android.R.drawable.stat_sys_download_done,
            "Instalar",
            pending,
        ).build()
    val notification = builder
        .setSmallIcon(android.R.drawable.stat_sys_download_done)
        .setContentTitle("Atualização pronta para instalar")
        .setContentText("Toque em Instalar para continuar.")
        .setContentIntent(pending)
        .addAction(installAction)
        .setAutoCancel(true)
        .setOnlyAlertOnce(true)
        .build()
    val manager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.notify(UPDATE_NOTIFICATION_ID, notification)
}

class EnturmaPackageReplacedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_MY_PACKAGE_REPLACED) return

        context.getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
            .edit()
            .clear()
            .apply()
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .cancel(UPDATE_NOTIFICATION_ID)

        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
            } ?: return

        val pending = PendingIntent.getActivity(
            context,
            UPDATE_RELAUNCH_REQUEST,
            launch,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        runCatching {
            val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarm.set(
                AlarmManager.ELAPSED_REALTIME_WAKEUP,
                android.os.SystemClock.elapsedRealtime() + 900L,
                pending,
            )
        }.onFailure {
            runCatching { pending.send() }
        }
    }
}

class EnturmaDownloadCompleteReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return
        val downloadId =
            intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
        val prefs =
            context.getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
        val expectedId = prefs.getLong(PREF_DOWNLOAD_ID, -1L)
        val baseVersion = prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null)

        if (
            downloadId <= 0 ||
            downloadId != expectedId ||
            baseVersion != BuildConfig.VERSION_NAME ||
            downloadedApkUri(context, downloadId) == null
        ) return

        if (!EnturmaAppState.foreground) {
            showInstallReadyNotification(context, downloadId)
        }
    }
}

class MainActivity : Activity() {
    companion object {
        private const val FILE_CHOOSER_REQUEST = 4101
        private const val MEDIA_PERMISSION_REQUEST = 4102
        private const val NOTIFICATION_PERMISSION_REQUEST = 4103
        private const val LOCATION_PERMISSION_REQUEST = 4104
        private const val GALLERY_PERMISSION_REQUEST = 4105
        private const val WEB_ORIGIN = "${webOrigin}"
        private const val APP_VERSION = "${version}"
    }

    private var fullscreenView: View? = null
    private var fullscreenCallback: WebChromeClient.CustomViewCallback? = null
    private var previousOrientation: Int = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
    private fun closeFullscreen() {
        val view = fullscreenView ?: return
        rootLayout.removeView(view)
        fullscreenView = null
        webView.visibility = View.VISIBLE
        requestedOrientation = previousOrientation
        WindowInsetsControllerCompat(window, rootLayout).show(WindowInsetsCompat.Type.systemBars())
        fullscreenCallback?.onCustomViewHidden()
        fullscreenCallback = null
    }
    private lateinit var rootLayout: FrameLayout
    private lateinit var webView: WebView
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingFileChooserParams: WebChromeClient.FileChooserParams? = null
    private var pendingPermissionRequest: PermissionRequest? = null
    private var pendingGeolocationOrigin: String? = null
    private var pendingGeolocationCallback: GeolocationPermissions.Callback? = null
    private var safeTopCssPx = 0
    private var safeRightCssPx = 0
    private var safeBottomCssPx = 0
    private var safeLeftCssPx = 0
    private var keyboardBottomCssPx = 0
    private var keyboardVisible = false
    private var lastSafeAreaSnapshot = ""
    private var chatComposerFocused = false
    private var chatSurfaceFocused = false
    private var updateDownloadId: Long? = null
    private var updateReceiverRegistered = false
    private var pendingUpdateUrl: String? = null

    private val updateDownloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return
            val downloadId =
                intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
            val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
            val expectedId = prefs.getLong(PREF_DOWNLOAD_ID, -1L)
            val baseVersion = prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null)

            if (
                downloadId <= 0 ||
                downloadId != expectedId ||
                baseVersion != APP_VERSION
            ) return

            val uri = downloadedApkUri(this@MainActivity, downloadId)
            if (uri == null) {
                Toast.makeText(
                    this@MainActivity,
                    "Não foi possível concluir a atualização.",
                    Toast.LENGTH_LONG,
                ).show()
                return
            }

            val notifications =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notifications.cancel(UPDATE_NOTIFICATION_ID)

            if (EnturmaAppState.foreground) {
                openDownloadedInstaller(uri, downloadId)
            } else {
                showInstallReadyNotification(this@MainActivity, downloadId)
            }
        }
    }

    private inner class EnturmaNativeBridge {
        @JavascriptInterface
        fun shareRoom(code: String, title: String) {
            if (!Regex("^[A-Za-z0-9]{6,16}$").matches(code)) return
            runOnUiThread {
                if (webView.url?.startsWith(${kotlinString(webOrigin + "/")}) != true) return@runOnUiThread
                val invitation = ${kotlinString(webOrigin + "/join/")} + code
                val send = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, title.take(120))
                    putExtra(Intent.EXTRA_TEXT, title.take(120) + "\\n" + invitation)
                }
                startActivity(Intent.createChooser(send, "Compartilhar sala"))
            }
        }

        @JavascriptInterface
        fun setLightTheme(light: Boolean) {
            runOnUiThread {
                applySystemBarTheme(light)
            }
        }

        @JavascriptInterface
        fun setTheme(theme: String) {
            if (theme !in setOf("light", "dark", "enturma")) return
            runOnUiThread {
                applySystemBarTheme(theme == "light", theme == "enturma")
            }
        }

        @JavascriptInterface
        fun installUpdate(downloadUrl: String) {
            runOnUiThread {
                startUpdateInstall(downloadUrl)
            }
        }

        @JavascriptInterface
        fun getPushRegistration(): String {
            return pushRegistrationJson()
        }

        @JavascriptInterface
        fun refreshPushToken() {
            runOnUiThread {
                refreshNativePushToken()
            }
        }

        @JavascriptInterface
        fun clearPushToken() {
            runOnUiThread {
                clearNativePushToken()
            }
        }

        @JavascriptInterface
        fun storeConversationKeys(json: String) {
            if (json.length > 200_000) return
            runOnUiThread {
                if (webView.url?.startsWith(${kotlinString(webOrigin + "/")}) != true) return@runOnUiThread
                val context = applicationContext
                Thread {
                    runCatching { EnturmaPrivateNotifications.store(context, json) }
                }.start()
            }
        }

        @JavascriptInterface
        fun clearConversationNotifications(conversation: String) {
            if (!UUID_PATTERN.matches(conversation)) return
            runOnUiThread {
                if (webView.url?.startsWith(${kotlinString(webOrigin + "/")}) != true) return@runOnUiThread
                EnturmaPrivateNotifications.forget(this@MainActivity, conversation)
            }
        }

        @JavascriptInterface
        fun setChatComposerFocused(focused: Boolean) {
            runOnUiThread {
                chatComposerFocused = focused
                ViewCompat.requestApplyInsets(rootLayout)
            }
        }

        @JavascriptInterface
        fun setChatSurfaceFocused(focused: Boolean) {
            runOnUiThread {
                chatSurfaceFocused = focused
                ViewCompat.requestApplyInsets(rootLayout)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        EnturmaAppState.foreground = true
        initializeFirebase(this)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT

        CookieManager.getInstance().setAcceptCookie(true)

        rootLayout = FrameLayout(this)
        webView = WebView(this)
        webView.setBackgroundColor(Color.parseColor("#0f1917"))
        rootLayout.addView(
            webView,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ),
        )
        setContentView(rootLayout)

        applySystemBarTheme(false)
        webView.addJavascriptInterface(EnturmaNativeBridge(), "EnturmaNative")
        registerUpdateDownloadReceiver()
        EnturmaUpdateScheduler.schedule(this)
        EnturmaUpdateScheduler.checkNow(this)
        handleUpdateIntent(intent)

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

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { _, insets ->
            val safeInsets = insets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                    WindowInsetsCompat.Type.navigationBars() or
                    WindowInsetsCompat.Type.displayCutout(),
            )
            val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())
            val density = resources.displayMetrics.density.takeIf { it > 0f } ?: 1f
            safeTopCssPx = (safeInsets.top / density).toInt()
            safeRightCssPx = (safeInsets.right / density).toInt()
            safeBottomCssPx = (safeInsets.bottom / density).toInt()
            safeLeftCssPx = (safeInsets.left / density).toInt()
            keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime())

            // Chat surfaces behave like native messengers: when a message
            // composer owns focus, shrink only the WebView's usable height to
            // the top of the IME. The message list then flexes above the
            // composer without scrolling the whole app or floating controls.
            val params = webView.layoutParams as FrameLayout.LayoutParams
            // Keep the WebView full height in chats, preserving its drawing
            // surface during IME animation; only flex chat panels shrink.
            val chatImeActive = keyboardVisible && chatSurfaceFocused
            val resizeChatForIme = keyboardVisible && chatComposerFocused && !chatSurfaceFocused
            val targetBottomMargin = if (resizeChatForIme) imeInsets.bottom else 0
            if (params.bottomMargin != targetBottomMargin) {
                params.bottomMargin = targetBottomMargin
                webView.layoutParams = params
            }

            // Once the native WebView is resized, CSS must not subtract the
            // keyboard a second time. Other focused fields still receive the
            // raw IME inset for their normal visibility handling.
            keyboardBottomCssPx =
                if (keyboardVisible && !resizeChatForIme)
                    (imeInsets.bottom / density).toInt()
                else 0
            // The Android IME dispatches intermediate insets every animation
            // frame. Do not reinject the full WebView JS bootstrap when only
            // the WebView's native margin has changed: that can visibly flash.
            val snapshot = listOf(
                safeTopCssPx, safeRightCssPx, safeBottomCssPx, safeLeftCssPx,
                keyboardBottomCssPx, keyboardVisible, chatImeActive,
            ).joinToString("|")
            if (snapshot != lastSafeAreaSnapshot) {
                lastSafeAreaSnapshot = snapshot
                syncSafeAreaCss()
            }
            insets
        }
        ViewCompat.requestApplyInsets(rootLayout)

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            setGeolocationEnabled(true)
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
                dispatchCachedPushRegistration()
                refreshNativePushToken()
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
            override fun onShowCustomView(view: View?, callback: WebChromeClient.CustomViewCallback?) {
                if (view == null || fullscreenView != null) { callback?.onCustomViewHidden(); return }
                fullscreenView = view
                fullscreenCallback = callback
                previousOrientation = requestedOrientation
                requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                webView.visibility = View.GONE
                rootLayout.addView(view, FrameLayout.LayoutParams(-1, -1))
                WindowInsetsControllerCompat(window, rootLayout).hide(WindowInsetsCompat.Type.systemBars())
            }
            override fun onHideCustomView() { closeFullscreen() }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?,
            ) {
                if (callback == null) return
                if (origin.isNullOrBlank()) {
                    callback.invoke(origin ?: "", false, false)
                    return
                }
                runOnUiThread {
                    val trusted = runCatching {
                        val uri = Uri.parse(origin)
                        val expected = Uri.parse(WEB_ORIGIN)
                        uri.scheme == "https" &&
                            uri.host.equals(expected.host, ignoreCase = true)
                    }.getOrDefault(false)
                    if (!trusted) {
                        callback.invoke(origin, false, false)
                        return@runOnUiThread
                    }

                    val coarseGranted =
                        checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
                            PackageManager.PERMISSION_GRANTED
                    val fineGranted =
                        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
                            PackageManager.PERMISSION_GRANTED
                    if (coarseGranted || fineGranted) {
                        callback.invoke(origin, true, false)
                        return@runOnUiThread
                    }

                    val previousOrigin = pendingGeolocationOrigin
                    if (previousOrigin != null) {
                        pendingGeolocationCallback?.invoke(
                            previousOrigin,
                            false,
                            false,
                        )
                    }
                    pendingGeolocationOrigin = origin
                    pendingGeolocationCallback = callback
                    requestPermissions(
                        arrayOf(
                            Manifest.permission.ACCESS_COARSE_LOCATION,
                            Manifest.permission.ACCESS_FINE_LOCATION,
                        ),
                        LOCATION_PERMISSION_REQUEST,
                    )
                }
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                if (request == null) return
                runOnUiThread {
                    val expected = Uri.parse(WEB_ORIGIN)
                    val actual = request.origin
                    if (actual.scheme != expected.scheme || actual.host != expected.host || actual.port != expected.port) {
                        request.deny()
                        return@runOnUiThread
                    }
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
                pendingFileChooserParams = params

                // System pickers grant access to selected URIs only.
                // No blanket storage permission is needed to choose a photo or video.
                launchFileChooser(params)
                return true
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
        EnturmaAppState.foreground = true
        refreshNativePushToken()
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
        maybeOpenCompletedUpdate()
        if (::webView.isInitialized) {
            webView.postDelayed({
                webView.evaluateJavascript(
                    "window.dispatchEvent(new Event('enturma-mobile-update-check'));",
                    null,
                )
            }, 350L)
        }
    }

    override fun onPause() {
        EnturmaAppState.foreground = false
        CookieManager.getInstance().flush()
        super.onPause()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        val updateHandled = handleUpdateIntent(intent)
        val route = routeFromIntent(intent)
        if (route != null && ::webView.isInitialized) {
            webView.loadUrl("\${WEB_ORIGIN}\${route}")
        }
        if (updateHandled) return
    }

    private fun handleUpdateIntent(intent: Intent?): Boolean {
        return when (intent?.action) {
            UPDATE_ACTION_SETTINGS -> {
                (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                    .cancel(UPDATE_NOTIFICATION_ID)
                if (::webView.isInitialized) {
                    webView.loadUrl("\${WEB_ORIGIN}/settings?update=1")
                }
                true
            }
            UPDATE_ACTION_INSTALL -> {
                val downloadUrl = intent.getStringExtra(UPDATE_EXTRA_URL) ?: return true
                startUpdateInstall(downloadUrl)
                true
            }
            UPDATE_ACTION_OPEN_INSTALLER -> {
                val downloadId =
                    intent.getLongExtra(UPDATE_EXTRA_DOWNLOAD_ID, -1L)
                openDownloadedInstallerById(downloadId)
                true
            }
            else -> false
        }
    }

    private fun routeFromIntent(intent: Intent?): String? {
        if (intent?.action == UPDATE_ACTION_SETTINGS) {
            return "/settings?update=1"
        }
        if (intent?.action == PUSH_ACTION_OPEN) {
            intent.getStringExtra(PUSH_EXTRA_CONVERSATION)
                ?.takeIf { UUID_PATTERN.matches(it) }
                ?.let { EnturmaPrivateNotifications.forget(this, it) }
            return safePushHref(intent.getStringExtra(PUSH_EXTRA_HREF))
        }
        val uri = intent?.data ?: return null
        if (uri.scheme != "enturma") return null
        val path = uri.path?.takeIf { it.startsWith("/") } ?: return null
        val query = uri.encodedQuery?.let { "?\${it}" } ?: ""
        return "\${path}\${query}"
    }

    private fun pushRegistrationJson(): String {
        val prefs = getSharedPreferences(PUSH_PREFS, Context.MODE_PRIVATE)
        return JSONObject()
            .put("installationId", pushInstallationId(this))
            .put("token", prefs.getString(PREF_PUSH_TOKEN, "") ?: "")
            .put("platform", "ANDROID")
            .toString()
    }

    private fun dispatchCachedPushRegistration() {
        if (!::webView.isInitialized) return
        val prefs = getSharedPreferences(PUSH_PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(PREF_PUSH_TOKEN, null) ?: return
        if (token.isBlank()) return
        val payload = JSONObject()
            .put("installationId", pushInstallationId(this))
            .put("token", token)
            .put("platform", "ANDROID")
        val script =
            "(function(){var detail=" + payload.toString() +
                ";window.dispatchEvent(new CustomEvent('enturma-native-push-token',{detail:detail}));" +
                "try{var key=detail.installationId+':'+detail.token;" +
                "var raw=localStorage.getItem('enturma-native-push-registration-v2');" +
                "var cached=raw?JSON.parse(raw):{};" +
                "if(cached.key===key&&Date.now()-Number(cached.at||0)<21600000)return;" +
                "fetch('/api/backend/notifications/push-device',{" +
                "method:'POST',credentials:'include',headers:{'Content-Type':'application/json'}," +
                "body:JSON.stringify(detail)}).then(function(response){" +
                "if(response.ok)localStorage.setItem('enturma-native-push-registration-v2'," +
                "JSON.stringify({key:key,at:Date.now()}));});}catch(_){}})();"
        webView.evaluateJavascript(script, null)
    }

    private fun refreshNativePushToken() {
        if (!initializeFirebase(this)) return
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) return@addOnCompleteListener
            val token = task.result ?: return@addOnCompleteListener
            storePushToken(this, token)
            runOnUiThread {
                dispatchCachedPushRegistration()
            }
        }
    }

    private fun clearNativePushToken() {
        EnturmaPrivateNotifications.clear(this)
        getSharedPreferences(PUSH_PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(PREF_PUSH_TOKEN)
            .apply()
        if (initializeFirebase(this)) {
            FirebaseMessaging.getInstance().deleteToken()
        }
    }

    private fun registerUpdateDownloadReceiver() {
        if (updateReceiverRegistered) return
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // ACTION_DOWNLOAD_COMPLETE vem do DownloadManager do sistema.
            registerReceiver(updateDownloadReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(updateDownloadReceiver, filter)
        }
        updateReceiverRegistered = true
    }

    private fun openDownloadedInstaller(
        uri: Uri,
        downloadId: Long? = null,
        force: Boolean = false,
    ): Boolean {
        if (downloadId != null && downloadId > 0 && !force) {
            val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
            val promptedId = prefs.getLong(PREF_INSTALL_PROMPTED_ID, -1L)
            val promptedAt = prefs.getLong(PREF_INSTALL_PROMPTED_AT, 0L)
            if (
                promptedId == downloadId &&
                System.currentTimeMillis() - promptedAt < INSTALLER_DEDUP_MS
            ) return true
        }
        return runCatching {
            startActivity(
                Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(uri, "application/vnd.android.package-archive")
                    clipData = ClipData.newRawUri("Atualização do Enturma", uri)
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                },
            )
            if (downloadId != null && downloadId > 0) {
                getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
                    .edit()
                    .putLong(PREF_INSTALL_PROMPTED_ID, downloadId)
                    .putLong(PREF_INSTALL_PROMPTED_AT, System.currentTimeMillis())
                    .apply()
            }
            (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .cancel(UPDATE_NOTIFICATION_ID)
            true
        }.getOrElse {
            if (downloadId != null && downloadId > 0) {
                showInstallReadyNotification(this, downloadId)
            }
            Toast.makeText(
                this,
                "Não foi possível abrir o instalador automaticamente.",
                Toast.LENGTH_LONG,
            ).show()
            false
        }
    }

    private fun openDownloadedInstallerById(downloadId: Long): Boolean {
        if (downloadId <= 0) return false
        val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
        if (
            prefs.getLong(PREF_DOWNLOAD_ID, -1L) != downloadId ||
            prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null) != APP_VERSION
        ) return false

        val uri = downloadedApkUri(this, downloadId) ?: return false
        return openDownloadedInstaller(uri, downloadId)
    }

    private fun maybeOpenCompletedUpdate() {
        if (!EnturmaAppState.foreground) return
        val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
        val downloadId = prefs.getLong(PREF_DOWNLOAD_ID, -1L)
        if (
            downloadId <= 0 ||
            prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null) != APP_VERSION ||
            prefs.getLong(PREF_INSTALL_PROMPTED_ID, -1L) == downloadId
        ) return

        val uri = downloadedApkUri(this, downloadId) ?: return
        openDownloadedInstaller(uri, downloadId)
    }

    private fun watchUpdateDownload(downloadId: Long) {
        Thread {
            val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            repeat(1800) {
                val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
                if (
                    prefs.getLong(PREF_DOWNLOAD_ID, -1L) != downloadId ||
                    prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null) != APP_VERSION
                ) return@Thread

                val cursor = manager.query(DownloadManager.Query().setFilterById(downloadId))
                var status = -1
                cursor.use {
                    if (it.moveToFirst()) {
                        status = it.getInt(
                            it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS),
                        )
                    }
                }

                when (status) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        val uri = manager.getUriForDownloadedFile(downloadId) ?: return@Thread
                        runOnUiThread {
                            if (!isFinishing && !isDestroyed) {
                                openDownloadedInstaller(uri, downloadId)
                            }
                        }
                        return@Thread
                    }
                    DownloadManager.STATUS_FAILED -> return@Thread
                }

                try {
                    Thread.sleep(1000)
                } catch (_: InterruptedException) {
                    return@Thread
                }
            }
        }.start()
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
        val prefs = getSharedPreferences(UPDATE_PREFS, Context.MODE_PRIVATE)
        val previousId = prefs.getLong(PREF_DOWNLOAD_ID, -1L)
        val previousUrl = prefs.getString(PREF_DOWNLOAD_URL, null)
        val previousBaseVersion = prefs.getString(PREF_DOWNLOAD_BASE_VERSION, null)

        if (
            previousId > 0 &&
            previousUrl == downloadUrl &&
            previousBaseVersion == APP_VERSION
        ) {
            val cursor = manager.query(DownloadManager.Query().setFilterById(previousId))
            cursor.use {
                if (it.moveToFirst()) {
                    when (it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))) {
                        DownloadManager.STATUS_PENDING,
                        DownloadManager.STATUS_RUNNING,
                        DownloadManager.STATUS_PAUSED -> {
                            watchUpdateDownload(previousId)
                            return
                        }
                        DownloadManager.STATUS_SUCCESSFUL -> {
                            val downloaded = manager.getUriForDownloadedFile(previousId)
                            if (downloaded != null) {
                                openDownloadedInstaller(downloaded, previousId, true)
                                return
                            }
                        }
                    }
                }
            }
        }

        updateDownloadId = manager.enqueue(
            DownloadManager.Request(uri)
                .setTitle("Atualização do Enturma")
                .setDescription("Baixando a nova versão do aplicativo")
                .setMimeType("application/vnd.android.package-archive")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE),
        )
        prefs.edit()
            .putLong(PREF_DOWNLOAD_ID, updateDownloadId ?: -1L)
            .putString(PREF_DOWNLOAD_URL, downloadUrl)
            .putString(PREF_DOWNLOAD_BASE_VERSION, APP_VERSION)
            .remove(PREF_INSTALL_PROMPTED_ID)
            .remove(PREF_INSTALL_PROMPTED_AT)
            .apply()
        (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
            .cancel(UPDATE_NOTIFICATION_ID)
        updateDownloadId?.let { watchUpdateDownload(it) }
    }

    private fun applySystemBarTheme(light: Boolean, enturma: Boolean = false) {
        // Manual IME resize temporarily exposes the native content window
        // below the WebView. Match its background to the active app theme so
        // Android never reveals the default white launch/window surface.
        val appBackground = Color.parseColor(if (light) "#ffffff" else if (enturma) "#0b211a" else "#0f1917")
        window.setBackgroundDrawable(ColorDrawable(appBackground))
        window.decorView.setBackgroundColor(appBackground)
        if (::rootLayout.isInitialized) rootLayout.setBackgroundColor(appBackground)
        if (::webView.isInitialized) webView.setBackgroundColor(appBackground)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = light
            isAppearanceLightNavigationBars = light
        }
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
    }

    private fun syncSafeAreaCss() {
        if (!::webView.isInitialized) return

        val keyboardState = if (keyboardVisible) "true" else "false"
        val nativeChatIme = if (keyboardVisible && chatSurfaceFocused) "true" else "false"
        val script = """
            (function() {
              var root = document.documentElement;
              if (!root) return;

              root.dataset.enturmaMobile = "true";
              root.style.setProperty("--native-safe-top", "\${safeTopCssPx}px");
              root.style.setProperty("--native-safe-right", "\${safeRightCssPx}px");
              root.style.setProperty("--native-safe-bottom", "\${safeBottomCssPx}px");
              root.style.setProperty("--native-safe-left", "\${safeLeftCssPx}px");
              root.style.setProperty("--native-keyboard-bottom", "\${keyboardBottomCssPx}px");
              root.dataset.enturmaIme = "\${keyboardState}";
              root.dataset.enturmaNativeChatIme = "\${nativeChatIme}";

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
                '  html[data-enturma-mobile="true"][data-enturma-ime="true"] .mobile-bottom-nav {',
                '    display: none !important;',
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
                  if (window.EnturmaNative && typeof window.EnturmaNative.setTheme === "function") {
                    window.EnturmaNative.setTheme(root.dataset.palette === "enturma" ? "enturma" : light ? "light" : "dark");
                  } else if (window.EnturmaNative && typeof window.EnturmaNative.setLightTheme === "function") {
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
                  if (mutations[i].attributeName === "data-theme" || mutations[i].attributeName === "data-palette") {
                    syncNativeTheme();
                    break;
                  }
                }
              });
              window.__enturmaThemeObserver.observe(root, {
                attributes: true,
                attributeFilter: ["data-theme", "data-palette"]
              });

              function nativeVersionIsNewer(remote, current) {
                var a = String(remote || "").split(".").map(Number);
                var b = String(current || "").split(".").map(Number);
                var size = Math.max(a.length, b.length);
                for (var i = 0; i < size; i++) {
                  var av = a[i] || 0;
                  var bv = b[i] || 0;
                  if (av !== bv) return av > bv;
                }
                return false;
              }

              function nativeCurrentVersion() {
                var match = navigator.userAgent.match(/EnturmaMobile\\/(\\d+\\.\\d+\\.\\d+)/);
                return match ? match[1] : "0.0.0";
              }

              function ensureNativeUpdateStyles() {
                var id = "enturma-native-update-style";
                var existing = document.getElementById(id);
                if (existing) return;
                var style = document.createElement("style");
                style.id = id;
                style.textContent = [
                  ".enturma-native-update-pending{position:relative!important;outline:2px solid var(--accent,#d9f56d)!important;}",
                  ".enturma-native-update-pending::after{content:'';position:absolute;top:3px;right:8px;width:10px;height:10px;border-radius:50%;background:#e53935;border:2px solid var(--bg,#0f1917);}",
                  ".enturma-native-update-button{position:relative!important;outline:2px solid var(--accent,#d9f56d)!important;font-size:22px!important;font-weight:800!important;}",
                  ".enturma-native-update-button::after{content:'';position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#e53935;border:2px solid var(--bg,#0f1917);}",
                  "#enturma-native-update-dialog{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:20px;background:#0009;}",
                  "#enturma-native-update-dialog .enturma-native-update-card{width:min(500px,100%);border:1px solid var(--border,#33413d);border-radius:20px;background:var(--bg,#0f1917);color:var(--ink,#f5f8ee);padding:24px;box-shadow:0 24px 80px #0008;}",
                  "#enturma-native-update-dialog h2{margin:0 0 12px;font-size:1.45rem;}",
                  "#enturma-native-update-dialog p{margin:10px 0 18px;line-height:1.55;}",
                  "#enturma-native-update-dialog .enturma-native-update-actions{display:flex;gap:10px;flex-wrap:wrap;}",
                  "#enturma-native-update-dialog button{min-height:46px;padding:10px 16px;border-radius:12px;border:0;font:inherit;font-weight:800;cursor:pointer;background:var(--accent,#d9f56d);color:#10211c;}",
                  "#enturma-native-update-dialog button.secondary{background:transparent;color:var(--ink,#f5f8ee);border:1px solid var(--border,#33413d);}"
                ].join("\\n");
                (document.head || root).appendChild(style);
              }

              function openNativeUpdateDialog(release) {
                if (!release || !release.downloadUrl) return;
                var old = document.getElementById("enturma-native-update-dialog");
                if (old) old.remove();

                ensureNativeUpdateStyles();

                var overlay = document.createElement("div");
                overlay.id = "enturma-native-update-dialog";
                overlay.setAttribute("role", "dialog");
                overlay.setAttribute("aria-modal", "true");
                overlay.setAttribute("aria-label", "Atualização do Enturma");

                var card = document.createElement("section");
                card.className = "enturma-native-update-card";

                var title = document.createElement("h2");
                title.textContent = "Nova atualização do Enturma";

                var versionText = document.createElement("p");
                versionText.textContent =
                  "Versão " + release.version +
                  " disponível. Recomendamos atualizar para receber correções e novos recursos.";

                var actions = document.createElement("div");
                actions.className = "enturma-native-update-actions";

                var update = document.createElement("button");
                update.type = "button";
                update.textContent = "Atualizar agora";
                update.onclick = function() {
                  try {
                    if (
                      window.EnturmaNative &&
                      typeof window.EnturmaNative.installUpdate === "function"
                    ) {
                      window.EnturmaNative.installUpdate(release.downloadUrl);
                      update.disabled = true;
                      update.textContent = "Download iniciado";
                    } else {
                      window.location.href = release.downloadUrl;
                    }
                  } catch (_) {
                    window.location.href = release.downloadUrl;
                  }
                };

                var later = document.createElement("button");
                later.type = "button";
                later.className = "secondary";
                later.textContent = "Depois";
                later.onclick = function() {
                  overlay.remove();
                };

                actions.appendChild(update);
                actions.appendChild(later);
                card.appendChild(title);
                card.appendChild(versionText);
                card.appendChild(actions);
                overlay.appendChild(card);
                document.body.appendChild(overlay);
              }

              function applyNativeUpdateMarkers(release) {
                if (!release) return;
                ensureNativeUpdateStyles();

                document
                  .querySelectorAll('a[href="/settings"],a[href^="/settings?"]')
                  .forEach(function(link) {
                    link.classList.add("enturma-native-update-pending");
                  });

                var more = document.querySelector(
                  '.mobile-bottom-nav button[aria-label="Mais opções"]'
                );
                if (more) more.classList.add("enturma-native-update-pending");

                if (location.pathname === "/settings") {
                  var heading = document.querySelector(".profile-page-heading");
                  if (
                    heading &&
                    !heading.querySelector(".enturma-native-update-button")
                  ) {
                    var button = document.createElement("button");
                    button.type = "button";
                    button.className =
                      "icon-control enturma-native-update-button";
                    button.setAttribute(
                      "aria-label",
                      "Atualização do Enturma disponível"
                    );
                    button.setAttribute(
                      "title",
                      "Atualização do Enturma disponível"
                    );
                    button.textContent = "↻";
                    button.onclick = function() {
                      openNativeUpdateDialog(release);
                    };
                    heading.appendChild(button);
                  }
                }

                var query = new URLSearchParams(location.search);
                if (
                  query.get("update") === "1" &&
                  window.__enturmaNativeUpdatePrompted !== release.version
                ) {
                  window.__enturmaNativeUpdatePrompted = release.version;
                  openNativeUpdateDialog(release);
                }
              }

              async function checkNativeUpdate() {
                if (root.dataset.enturmaUpdateUi === "web") return;
                try {
                  var response = await fetch(
                    "https://enturma-android-download-v3-production.up.railway.app/latest-android.json?ts=" +
                      Date.now(),
                    { cache: "no-store" }
                  );
                  if (!response.ok) return;
                  var release = await response.json();
                  if (
                    !/^\\d+\\.\\d+\\.\\d+$/.test(release.version || "") ||
                    !String(release.downloadUrl || "").startsWith(
                      "https://enturma-android-download-v3-production.up.railway.app/"
                    ) ||
                    !nativeVersionIsNewer(
                      release.version,
                      nativeCurrentVersion()
                    )
                  ) return;

                  window.__enturmaNativeRelease = release;
                  applyNativeUpdateMarkers(release);
                } catch (_) {}
              }

              if (window.__enturmaNativeUpdateObserver) {
                window.__enturmaNativeUpdateObserver.disconnect();
              }
              window.__enturmaNativeUpdateObserver = new MutationObserver(function() {
                if (window.__enturmaNativeRelease) {
                  applyNativeUpdateMarkers(window.__enturmaNativeRelease);
                }
              });
              window.__enturmaNativeUpdateObserver.observe(
                document.body || root,
                { childList: true, subtree: true }
              );

              void checkNativeUpdate();
              if (!window.__enturmaNativeUpdateInterval) {
                window.__enturmaNativeUpdateInterval = setInterval(
                  checkNativeUpdate,
                  15 * 60 * 1000
                );
              }
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

    private fun acceptedMimeTypes(params: WebChromeClient.FileChooserParams?): List<String> =
        (params?.acceptTypes ?: emptyArray()).flatMap { it.split(",") }
            .map { it.trim().lowercase(java.util.Locale.ROOT) }.filter { it.isNotEmpty() }

    private fun documentPicker(params: WebChromeClient.FileChooserParams?): Intent {
        val types = acceptedMimeTypes(params)
        return Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = when {
                types.isNotEmpty() && types.all { it.startsWith("image/") } -> "image/*"
                types.isNotEmpty() && types.all { it.startsWith("video/") } -> "video/*"
                types.size == 1 && types[0].contains("/") -> types[0]
                else -> "*/*"
            }
            val mimeTypes = types.filter { it.contains("/") }
            if (mimeTypes.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes.toTypedArray())
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE,
                params?.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    private fun launchFileChooser(params: WebChromeClient.FileChooserParams?) {
        pendingFileChooserParams = null
        val types = acceptedMimeTypes(params)
        val visualOnly = types.isNotEmpty() && types.all {
            it.startsWith("image/") || it.startsWith("video/")
        }
        try {
            val intent = if (visualOnly && params?.isCaptureEnabled != true) {
                val mediaType = when {
                    types.all { it.startsWith("image/") } -> ActivityResultContracts.PickVisualMedia.ImageOnly
                    types.all { it.startsWith("video/") } -> ActivityResultContracts.PickVisualMedia.VideoOnly
                    else -> ActivityResultContracts.PickVisualMedia.ImageAndVideo
                }
                val request = PickVisualMediaRequest(mediaType)
                if (params?.mode == WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE)
                    ActivityResultContracts.PickMultipleVisualMedia(10).createIntent(this, request)
                else ActivityResultContracts.PickVisualMedia().createIntent(this, request)
            } else if (params?.isCaptureEnabled == true) {
                params.createIntent()
            } else documentPicker(params)
            startActivityForResult(intent, FILE_CHOOSER_REQUEST)
        } catch (_: ActivityNotFoundException) {
            try {
                startActivityForResult(documentPicker(params), FILE_CHOOSER_REQUEST)
            } catch (_: ActivityNotFoundException) {
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = null
                Toast.makeText(this, "Nenhuma galeria ou seletor de arquivos foi encontrado.", Toast.LENGTH_SHORT).show()
            }
        } catch (_: SecurityException) {
            fileChooserCallback?.onReceiveValue(null)
            fileChooserCallback = null
            Toast.makeText(this, "Não foi possível abrir a galeria. Tente novamente.", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openExternal(uri: Uri): Boolean {
        return try {
            startActivity(Intent(if (uri.scheme == "tel") Intent.ACTION_DIAL else Intent.ACTION_VIEW, uri))
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
            refreshNativePushToken()
        }
        if (requestCode == GALLERY_PERMISSION_REQUEST) {
            val params = pendingFileChooserParams
            pendingFileChooserParams = null
            launchFileChooser(params)
        }
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            val callback = pendingGeolocationCallback
            val origin = pendingGeolocationOrigin
            pendingGeolocationCallback = null
            pendingGeolocationOrigin = null
            if (callback != null && origin != null) {
                val granted = grantResults.any { it == PackageManager.PERMISSION_GRANTED }
                callback.invoke(origin, granted, false)
            }
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
        if (fullscreenView != null) closeFullscreen()
        else if (::webView.isInitialized && webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    override fun onDestroy() {
        closeFullscreen()
        pendingPermissionRequest?.deny()
        pendingPermissionRequest = null
        val pendingOrigin = pendingGeolocationOrigin
        if (pendingOrigin != null) {
            pendingGeolocationCallback?.invoke(
                pendingOrigin,
                false,
                false,
            )
        }
        pendingGeolocationCallback = null
        pendingGeolocationOrigin = null
        fileChooserCallback?.onReceiveValue(null)
        fileChooserCallback = null
        pendingFileChooserParams = null

        if (updateReceiverRegistered) {
            runCatching { unregisterReceiver(updateDownloadReceiver) }
            updateReceiverRegistered = false
        }

        CookieManager.getInstance().flush()
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

const manifestTarget = path.join(
  mobile,
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml",
);
let manifest = fs.readFileSync(manifestTarget, "utf8");
if (!manifest.includes("EnturmaUpdateReceiver")) {
  manifest = manifest.replace(
    "</application>",
    `    <receiver android:name=".EnturmaUpdateReceiver" android:exported="false" />
    <receiver android:name=".EnturmaBootReceiver" android:enabled="true" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
      </intent-filter>
    </receiver>
  </application>`,
  );
}
if (!manifest.includes("EnturmaPackageReplacedReceiver")) {
  manifest = manifest.replace(
    "</application>",
    `    <receiver android:name=".EnturmaPackageReplacedReceiver" android:enabled="true" android:exported="false">
      <intent-filter>
        <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />
      </intent-filter>
    </receiver>
  </application>`,
  );
}
if (!manifest.includes("EnturmaDownloadCompleteReceiver")) {
  manifest = manifest.replace(
    "</application>",
    `    <receiver android:name=".EnturmaDownloadCompleteReceiver" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.DOWNLOAD_COMPLETE" />
      </intent-filter>
    </receiver>
  </application>`,
  );
}
if (!manifest.includes("EnturmaMessagingService")) {
  manifest = manifest.replace(
    "</application>",
    `    <service android:name=".EnturmaMessagingService" android:exported="false">
      <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
      </intent-filter>
    </service>
  </application>`,
  );
}
fs.writeFileSync(manifestTarget, manifest, "utf8");

const firebaseConfigured = Boolean(
  firebaseProjectId && firebaseAppId && firebaseApiKey && firebaseSenderId,
);

if (firebaseConfigured) {
  const googleServices = {
    project_info: {
      project_number: firebaseSenderId,
      project_id: firebaseProjectId,
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: firebaseAppId,
          android_client_info: {
            package_name: "br.com.enturma.app",
          },
        },
        api_key: [{ current_key: firebaseApiKey }],
      },
    ],
    configuration_version: "1",
  };
  fs.writeFileSync(
    path.join(mobile, "android", "app", "google-services.json"),
    JSON.stringify(googleServices, null, 2),
    "utf8",
  );

  const rootGradleTarget = path.join(mobile, "android", "build.gradle");
  let rootGradle = fs.readFileSync(rootGradleTarget, "utf8");
  if (!rootGradle.includes("com.google.gms:google-services")) {
    rootGradle = rootGradle.replace(
      /dependencies\s*\{/,
      `dependencies {
        classpath("com.google.gms:google-services:4.5.0")`,
    );
  }
  fs.writeFileSync(rootGradleTarget, rootGradle, "utf8");
}

const appGradleTarget = path.join(mobile, "android", "app", "build.gradle");
let appGradle = fs.readFileSync(appGradleTarget, "utf8");
if (!appGradle.includes("com.google.firebase:firebase-messaging")) {
  appGradle = appGradle.replace(
    /dependencies\s*\{/,
    `dependencies {
    implementation platform("com.google.firebase:firebase-bom:34.19.0")
    implementation "com.google.firebase:firebase-messaging"`,
  );
}
if (
  firebaseConfigured &&
  !appGradle.includes("com.google.gms.google-services")
) {
  appGradle = appGradle.replace(
    'apply plugin: "com.android.application"',
    'apply plugin: "com.android.application"\napply plugin: "com.google.gms.google-services"',
  );
}
fs.writeFileSync(appGradleTarget, appGradle, "utf8");
console.log(`Enturma Android Web shell instalado em ${target}`);
console.log(`Origem Web: ${webOrigin} | Versão: ${version}`);
