package com.stellarnet.quantum24

import android.Manifest
import android.app.Activity
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothProfile\nimport android.bluetooth.le.ScanFilter\nimport android.bluetooth.le.ScanSettings\nimport java.util.UUID
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
 private var scanner: android.bluetooth.le.BluetoothLeScanner? = null
 private var gatt: BluetoothGatt? = null
 private var deviceId: String? = null\n private val serviceUuid=UUID.fromString("7B1A0001-8E8A-4B2B-9D24-243300000024")\n private val telemetryUuid=UUID.fromString("7B1A0002-8E8A-4B2B-9D24-243300000024")\n private val commandUuid=UUID.fromString("7B1A0003-8E8A-4B2B-9D24-243300000024")\n private val ackUuid=UUID.fromString("7B1A0004-8E8A-4B2B-9D24-243300000024")

 override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(savedInstanceState)
  setContentView(WebView(this).apply { settings.javaScriptEnabled=true; webViewClient=WebViewClient(); loadUrl("https://quantum24-gains.onrender.com") })
  report("DISCOVERED", mapOf("nativeShell" to true, "usbHost" to (getSystemService(UsbManager::class.java) != null), "nfc" to (NfcAdapter.getDefaultAdapter(this) != null)))
  requestBluetooth()
 }

 private fun requestBluetooth() {
  if (android.os.Build.VERSION.SDK_INT>=31 &&
      ContextCompat.checkSelfPermission(this,Manifest.permission.BLUETOOTH_SCAN)!=PackageManager.PERMISSION_GRANTED) {
   ActivityCompat.requestPermissions(this,arrayOf(Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT),42)
   return
  }
  startBleDiscovery()
 }

 override fun onRequestPermissionsResult(requestCode:Int, permissions:Array<out String>, grantResults:IntArray) {
  super.onRequestPermissionsResult(requestCode,permissions,grantResults)
  if(requestCode==42 && grantResults.all { it==PackageManager.PERMISSION_GRANTED }) startBleDiscovery()
  else report("AUTH_REQUIRED", mapOf("authorization" to false, "bluetoothPermission" to false))
 }

 private fun startBleDiscovery() {
  val adapter=BluetoothAdapter.getDefaultAdapter()
  if(adapter==null || !adapter.isEnabled) { report("UNSUPPORTED", mapOf("bluetoothAvailable" to false)); return }
  scanner=adapter.bluetoothLeScanner
  val callback=object: android.bluetooth.le.ScanCallback() {
   override fun onScanResult(callbackType:Int,result:android.bluetooth.le.ScanResult) {
    val d=result.device
    val name=d.name ?: result.scanRecord?.deviceName ?: ""
    if(name.contains("Quantum24",ignoreCase=true)) {
     scanner?.stopScan(this)
     connect(d,result.rssi)
    }
   }
   override fun onScanFailed(errorCode:Int) { report("OFFLINE", mapOf("connection" to false,"scanError" to errorCode)) }
  }
  val filter=ScanFilter.Builder().setServiceUuid(android.os.ParcelUuid(serviceUuid)).setDeviceName("Quantum24 Reference").build()\n  scanner?.startScan(listOf(filter),ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),callback)
 }

 private fun connect(device:BluetoothDevice,rssi:Int) {
  report("AUTHORIZED", mapOf("authorization" to true,"bluetoothAddressPresent" to true))
  gatt=device.connectGatt(this,false,gattCallback)
  report("DISCOVERED", mapOf("rssi" to rssi,"deviceName" to (device.name ?: "")))
 }

 private val gattCallback=object:BluetoothGattCallback() {
  override fun onConnectionStateChange(g:BluetoothGatt,status:Int,newState:Int) {
   if(newState==BluetoothProfile.STATE_CONNECTED) {
    gatt=g
    report("CONNECTED", mapOf("connection" to true,"gattStatus" to status))
    g.discoverServices()
   } else if(newState==BluetoothProfile.STATE_DISCONNECTED) {
    report("OFFLINE", mapOf("connection" to false,"gattStatus" to status))
   }
  }

  override fun onServicesDiscovered(g:BluetoothGatt,status:Int) {
   if(status!=BluetoothGatt.GATT_SUCCESS) return
   val readable=g.services.flatMap { it.characteristics }.firstOrNull {
    it.properties and BluetoothGattCharacteristic.PROPERTY_READ != 0
   }
   if(readable!=null) g.readCharacteristic(readable)
  }

  override fun onCharacteristicChanged(g:BluetoothGatt,c:BluetoothGattCharacteristic,value:ByteArray) {\n   if(c.uuid==ackUuid){ val json=runCatching{JSONObject(String(value))}.getOrNull(); if(json?.optBoolean("ok")==true && json.optString("op")=="ping") report("ACTION_VERIFIED",mapOf("connection" to true,"action" to true,"actionName" to "ping","ackVerified" to true,"byteCount" to value.size)) }\n  }\n\n  override fun onCharacteristicRead(g:BluetoothGatt,c:BluetoothGattCharacteristic,value:ByteArray,status:Int) {
   if(status==BluetoothGatt.GATT_SUCCESS && value.isNotEmpty()) {
    report("TELEMETRY_VERIFIED", mapOf(
     "connection" to true,"telemetry" to true,
     "serviceUUID" to c.service.uuid.toString(),
     "characteristicUUID" to c.uuid.toString(),
     "byteCount" to value.size,
     "readStatus" to status
    ))
   }
  }
 }

 private fun caps():List<String> {
  val c=mutableListOf("android_native","media")
  if (BluetoothAdapter.getDefaultAdapter()!=null) c.add("bluetooth")
  if (getSystemService(UsbManager::class.java)!=null) c.add("usb")
  if (NfcAdapter.getDefaultAdapter(this)!=null) c.add("nfc")
  if (gatt!=null) c.add("bluetooth_gatt")
  return c
 }

 private fun report(state:String,evidence:Map<String,Any>) {
  Thread {
   try {
    val body=JSONObject().apply {
     put("platform","android");put("model",android.os.Build.MODEL);put("appVersion","native-v2")
     deviceId?.let { put("deviceId",it) }
     put("capabilities",JSONArray(caps()));put("state",state);put("evidence",JSONObject(evidence))
    }.toString()
    val con=URL(endpoint).openConnection() as HttpURLConnection
    con.requestMethod="POST";con.setRequestProperty("Content-Type","application/json");con.doOutput=true
    con.outputStream.use{it.write(body.toByteArray())}
    val response=con.inputStream.bufferedReader().use{it.readText()}
    runCatching { JSONObject(response).optString("deviceId").takeIf { it.isNotBlank() }?.let { returned -> deviceId=returned } }
   } catch(_:Exception) {}
  }.start()
 }
}
