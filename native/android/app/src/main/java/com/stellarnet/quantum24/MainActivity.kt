package com.stellarnet.quantum24

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.content.pm.PackageManager
import android.hardware.usb.UsbManager
import android.nfc.NfcAdapter
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : Activity() {
 private val endpoint="https://quantum24-gains.onrender.com/api/device-integration/report"
 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  setContentView(WebView(this).apply { settings.javaScriptEnabled=true; webViewClient=WebViewClient(); loadUrl("https://quantum24-gains.onrender.com") })
  requestBluetooth()
  report("DISCOVERED", mapOf("nativeShell" to true, "usbHost" to (getSystemService(UsbManager::class.java) != null), "nfc" to (NfcAdapter.getDefaultAdapter(this) != null)))
 }
 private fun requestBluetooth() {
  val usb = getSystemService(UsbManager::class.java)
  if (usb != null) report("DISCOVERED", mapOf("usbHostApi" to true, "usbDeviceCount" to usb.deviceList.size))
  if (android.os.Build.VERSION.SDK_INT>=31 && ContextCompat.checkSelfPermission(this,Manifest.permission.BLUETOOTH_SCAN)!=PackageManager.PERMISSION_GRANTED)
   ActivityCompat.requestPermissions(this,arrayOf(Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT),42)
 }
 private fun caps():List<String> {
  val c=mutableListOf("android_native","media")
  if (BluetoothAdapter.getDefaultAdapter()!=null) c.add("bluetooth")
  if (getSystemService(UsbManager::class.java)!=null) c.add("usb")
  if (NfcAdapter.getDefaultAdapter(this)!=null) c.add("nfc")
  return c
 }
 private fun report(state:String,evidence:Map<String,Any>) {
  Thread {
   try {
    val body=JSONObject().apply { put("platform","android");put("model",android.os.Build.MODEL);put("appVersion","native-v1");put("capabilities",JSONArray(caps()));put("state",state);put("evidence",JSONObject(evidence)) }.toString()
    val con=URL(endpoint).openConnection() as HttpURLConnection
    con.requestMethod="POST";con.setRequestProperty("Content-Type","application/json");con.doOutput=true
    con.outputStream.use{it.write(body.toByteArray())};con.inputStream.close()
   } catch(_:Exception) {}
  }.start()
 }
}