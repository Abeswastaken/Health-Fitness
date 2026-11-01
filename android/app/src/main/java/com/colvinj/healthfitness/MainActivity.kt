package com.colvinj.healthfitness

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.FileProvider
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

/**
 * Runs the app's screens (assets/www) full screen and gives them native parts through window.HFDev:
 * barcode scanner, Health Connect, web requests (AI and Open Food Facts), the AI key, sharing files,
 * clipboard and the photo/file picker.
 *
 * Async calls: JS calls HFDev.call(id, method, argsJson); the answer comes back as
 * window.HFNative._done(id, resultJson).
 */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private lateinit var health: Health
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingHcId: String? = null

    private val pickFile = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCallback = null
    }

    private val hcPermissions = registerForActivityResult(Health.permissionContract()) { granted ->
        val id = pendingHcId ?: return@registerForActivityResult
        pendingHcId = null
        done(id, JSONObject().put("granted", Health.toJson(granted)))
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        health = Health(this)
        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url
                    if (url.host == APP_HOST) return false
                    // Darebee, Planfit and other links open in the browser.
                    runCatching { startActivity(Intent(Intent.ACTION_VIEW, url)) }
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                // <input type="file">: photos for AI and gear, backup files for restore.
                override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    val type = params.acceptTypes.firstOrNull { it.isNotBlank() }?.let { if (it.startsWith(".")) "*/*" else it } ?: "*/*"
                    return runCatching { pickFile.launch(type); true }.getOrElse { fileCallback = null; false }
                }
            }
            addJavascriptInterface(Bridge(), "HFDev")
        }
        setContentView(web)
        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://$APP_HOST/assets/www/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.App && window.App.back) ? window.App.back() : false") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    private fun done(id: String, result: JSONObject) {
        val js = "window.HFNative && window.HFNative._done(${JSONObject.quote(id)}, ${result})"
        runOnUiThread { web.evaluateJavascript(js, null) }
    }

    private fun fail(id: String, e: Throwable) = done(id, JSONObject().put("error", e.message ?: e.javaClass.simpleName))

    private val prefs by lazy { getSharedPreferences("secrets", Context.MODE_PRIVATE) }

    inner class Bridge {
        @JavascriptInterface
        fun version(): String = "Health-Fitness " + BuildConfig.VERSION_NAME

        @JavascriptInterface
        fun copyText(text: String) {
            val cm = getSystemService(ClipboardManager::class.java)
            runOnUiThread { cm.setPrimaryClip(ClipData.newPlainText("Health-Fitness", text)) }
        }

        /** The AI key lives in app-private storage, never in the web page's data or backups. */
        @JavascriptInterface
        fun setSecret(name: String, value: String) {
            prefs.edit().apply { if (value.isBlank()) remove(name) else putString(name, value) }.apply()
        }

        @JavascriptInterface
        fun hasSecret(name: String): Boolean = !prefs.getString(name, null).isNullOrBlank()

        @JavascriptInterface
        fun shareJson(name: String, text: String) {
            val safe = name.replace(Regex("[^A-Za-z0-9._-]"), "_")
            val dir = File(cacheDir, "exports").apply { mkdirs() }
            val file = File(dir, safe).apply { writeText(text) }
            val uri: Uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", file)
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "application/json"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, name)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            runOnUiThread { startActivity(Intent.createChooser(send, "Share $safe")) }
        }

        @JavascriptInterface
        fun call(id: String, method: String, argsJson: String) {
            val args = runCatching { JSONObject(argsJson) }.getOrDefault(JSONObject())
            when (method) {
                "scan" -> runOnUiThread { scan(id) }
                "http" -> lifecycleScope.launch { runCatching { done(id, http(args)) }.onFailure { fail(id, it) } }
                "hcStatus" -> lifecycleScope.launch { runCatching { done(id, health.status()) }.onFailure { fail(id, it) } }
                "hcRequest" -> runOnUiThread {
                    pendingHcId = id
                    runCatching { hcPermissions.launch(Health.ALL) }.onFailure { pendingHcId = null; fail(id, it) }
                }
                "hcOpen" -> runOnUiThread { runCatching { startActivity(health.settingsIntent()) }; done(id, JSONObject().put("ok", true)) }
                "hcRead" -> lifecycleScope.launch { runCatching { done(id, health.read(args.optInt("days", 365))) }.onFailure { fail(id, it) } }
                "hcHeartRate" -> lifecycleScope.launch { runCatching { done(id, health.heartRate(args.getString("start"), args.getString("end"))) }.onFailure { fail(id, it) } }
                "hcWriteSession" -> lifecycleScope.launch { runCatching { done(id, health.writeSession(args)) }.onFailure { fail(id, it) } }
                else -> done(id, JSONObject().put("error", "unknown method $method"))
            }
        }
    }

    private fun scan(id: String) {
        val opts = GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E)
            .enableAutoZoom()
            .build()
        GmsBarcodeScanning.getClient(this, opts).startScan()
            .addOnSuccessListener { done(id, JSONObject().put("code", it.rawValue ?: "")) }
            .addOnCanceledListener { done(id, JSONObject().put("cancelled", true)) }
            .addOnFailureListener { fail(id, it) }
    }

    /** Plain web request done natively (no CORS limits). useAiKey adds the stored AI key. */
    private suspend fun http(a: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val conn = URL(a.getString("url")).openConnection() as HttpURLConnection
        conn.requestMethod = a.optString("method", "GET")
        conn.connectTimeout = 20_000
        conn.readTimeout = 120_000
        conn.setRequestProperty("User-Agent", "HealthFitness/" + BuildConfig.VERSION_NAME + " (personal app)")
        a.optJSONObject("headers")?.let { h -> h.keys().forEach { k -> conn.setRequestProperty(k, h.getString(k)) } }
        if (a.optBoolean("useAiKey")) prefs.getString("ai_key", null)?.let { conn.setRequestProperty("Authorization", "Bearer $it") }
        val body = a.optString("body", "")
        if (body.isNotEmpty()) {
            conn.doOutput = true
            if (conn.getRequestProperty("Content-Type") == null) conn.setRequestProperty("Content-Type", "application/json")
            conn.outputStream.use { it.write(body.toByteArray()) }
        }
        val code = conn.responseCode
        val text = (if (code in 200..299) conn.inputStream else conn.errorStream)?.bufferedReader()?.use { it.readText() } ?: ""
        conn.disconnect()
        JSONObject().put("status", code).put("body", text)
    }

    companion object {
        const val APP_HOST = "appassets.androidplatform.net"
    }
}
