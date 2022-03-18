#include <Arduino.h>
#include <esp_camera.h>
#include "soc/rtc_cntl_reg.h"  // Disable brownout problems
#include "soc/soc.h"           // Disable brownour problems
#include "PubSubClient.h"
#include <WiFi.h>

//timer
unsigned long prev_millis_take_frame = 0;   
const long take_frame_interval = 40; //ms
const long reset_wait_wifi_interval = 30000; //ms
 
//reset
bool reset_flag = false;

//LED
#define FLASH 4
#define PWR_LED 33
bool flash_state = false;

//WiFi
const char *ssid = "HOTEL MINH LONG"; 
const char *password = "55555555";
WiFiClient wifi_client;

//MQTT
const char *broker_addr = "128.199.105.69";
int broker_port = 1883;
const char *client_id = "esp32cam";
const char *mqtt_username = "anxYQc2AmG8fNcuaWaFA";
const char *mqtt_password = "xgeVOB89kyEVpHTfgKGg";
const char *up_topic = "dalat_survail/esp32cam/up";
const char *down_topic = "dalat_survail/esp32cam/down";
PubSubClient mqtt_client(wifi_client);

//Camera pins
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

bool camera_state = true;

void camera_init();
void wifi_connect();
void mqtt_connect();
void connect();
void message_received(char* topic, byte* payload, unsigned int length);
void mqtt_publish_frame(camera_fb_t *fb);
String uint8_array_to_String(uint8_t *buf, size_t len);
void toggle_flash();
void take_frame_and_send();
void reset(bool flag);

void setup() {
    Serial.begin(115200);
    pinMode(FLASH, OUTPUT);
    pinMode(PWR_LED, OUTPUT);
    digitalWrite(PWR_LED, LOW);
    camera_init();
    connect();
}

void loop() {
    if (!mqtt_client.connected() || !wifi_client.connected())
    {
      connect();
    }
    mqtt_client.loop();

    take_frame_and_send();
    toggle_flash();
    reset(reset_flag);
}

void take_frame_and_send() {
    if (camera_state == true) {
      unsigned long curr_millis = millis();
      if (curr_millis - prev_millis_take_frame >= take_frame_interval) {
        prev_millis_take_frame = curr_millis;
        camera_fb_t *fb = esp_camera_fb_get();
        Serial.println(fb->len);
        mqtt_publish_frame(fb);
        esp_camera_fb_return(fb);
      }
    }
}

void camera_init()
{
    WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); //disable brownout detector
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG; //Format of the pixel data: PIXFORMAT_ + YUV422|GRAYSCALE|RGB565|JPEG

    // if PSRAM IC present, init with UXGA resolution and higher JPEG quality
    //                      for larger pre-allocated frame buffer.
    if(psramFound()){
        config.frame_size = FRAMESIZE_VGA; //FRAMESIZE_ + QVGA|CIF|VGA|SVGA|XGA|SXGA|UXGA
        config.jpeg_quality = 17; //Quality of JPEG output. 0-63 lower means higher quality
        config.fb_count = 2;
    } else {
        config.frame_size = FRAMESIZE_VGA;
        config.jpeg_quality = 12;
        config.fb_count = 1;
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK)
    {
        Serial.printf("Camera init failed with error 0x%x", err);
        //reset(true);
    }

    //frame settings
    sensor_t * s = esp_camera_sensor_get();
    s->set_brightness(s, 1);     // -2 to 2
    //s->set_contrast(s, 0);       // -2 to 2
    //s->set_saturation(s, 0);     // -2 to 2
    //s->set_special_effect(s, 2); // 0 to 6 (0 - No Effect, 1 - Negative, 2 - Grayscale, 3 - Red Tint, 4 - Green Tint, 5 - Blue Tint, 6 - Sepia)
    //s->set_whitebal(s, 1);       // 0 = disable , 1 = enable
    //s->set_awb_gain(s, 1);       // 0 = disable , 1 = enable
    //s->set_wb_mode(s, 0);        // 0 to 4 - if awb_gain enabled (0 - Auto, 1 - Sunny, 2 - Cloudy, 3 - Office, 4 - Home)
    //s->set_exposure_ctrl(s, 1);  // 0 = disable , 1 = enable
    //s->set_aec2(s, 0);           // 0 = disable , 1 = enable
    //s->set_ae_level(s, 0);       // -2 to 2
    //s->set_aec_value(s, 0);    // 0 to 1200
    s->set_gain_ctrl(s, 0);      // 0 = disable , 1 = enable
    s->set_agc_gain(s, 5);       // 0 to 30
    s->set_gainceiling(s, (gainceiling_t)4);  // 0 to 6
    //s->set_bpc(s, 0);            // 0 = disable , 1 = enable
    //s->set_wpc(s, 1);            // 0 = disable , 1 = enable
    //s->set_raw_gma(s, 1);        // 0 = disable , 1 = enable
    //s->set_lenc(s, 1);           // 0 = disable , 1 = enable
    //s->set_hmirror(s, 0);        // 0 = disable , 1 = enable
    //s->set_vflip(s, 0);          // 0 = disable , 1 = enable
    //s->set_dcw(s, 1);            // 0 = disable , 1 = enable
    //s->set_colorbar(s, 0);       // 0 = disable , 1 = enable
}

void wifi_connect()
{
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Wifi connect to: ");
  Serial.println(ssid);
  
  bool pwr_led_state = false;
  unsigned long prev_millis = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(PWR_LED, pwr_led_state);
    pwr_led_state = !pwr_led_state;

    if (millis() - prev_millis >= reset_wait_wifi_interval) {
      reset(true);
    }
  }

  Serial.println("");
  Serial.println("WiFi connected");
  digitalWrite(PWR_LED, LOW);
}

void mqtt_connect()
{
  mqtt_client.setServer(broker_addr, broker_port);
  Serial.print("\nbroker connecting...");

  bool pwr_led_state = false;
  unsigned long prev_millis = 0;
  while (!mqtt_client.connect(client_id, mqtt_username, mqtt_password)) {
    Serial.print(".");
    delay(500);
    digitalWrite(PWR_LED, pwr_led_state);
    pwr_led_state = !pwr_led_state;

    if (millis() - prev_millis >= reset_wait_wifi_interval) {
      reset(true);
    }
  }

  Serial.println("\nconnected!");
  digitalWrite(PWR_LED, LOW);
  
  mqtt_client.subscribe(down_topic);
  mqtt_client.setCallback(message_received);
}

void connect()
{
  wifi_connect();
  mqtt_connect();
}

void mqtt_publish_frame(camera_fb_t *fb)
{   
    String encoded_frame = uint8_array_to_String(fb->buf, fb->len);
    mqtt_client.beginPublish(up_topic, encoded_frame.length(), false);
    mqtt_client.print(encoded_frame);
    mqtt_client.endPublish();
}

void message_received(char* topic, byte* payload, unsigned int length)
{   
    char *decoded_payload = (char *)malloc(length + 1);
    memcpy(decoded_payload, payload, length);
    decoded_payload[length] = '\0'; //add \0 because payload dont have \0

    Serial.println(decoded_payload);
    if (!strcmp(decoded_payload, "TOGGLE_FLASH"))
    {   
        flash_state = !flash_state;
    }

    else if (!strcmp(decoded_payload, "TOGGLE_CAMERA"))
    {
        camera_state = !camera_state;
    }

    else if (!strcmp(decoded_payload, "RESET")) {
        reset_flag = true;
    }
    free(decoded_payload);
}

String uint8_array_to_String(uint8_t *buf, size_t len) {
    String str_buf;
    str_buf.reserve(len + 1);
    for (int i = 0; i < (int)len; i++) {
        str_buf += (char)buf[i];
    }
    return str_buf;
}

void toggle_flash() {
    digitalWrite(FLASH, flash_state);
}

void reset(bool flag) {
    if (flag == true) {
      WiFi.disconnect();
      ESP.restart();
    }
}