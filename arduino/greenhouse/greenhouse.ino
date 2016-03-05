
#include <Wire.h>
#include <Encoder.h>
#include <TimerOne.h>
#include <SerialCommand.h>

//int anemometer_length = 
const int led = LED_BUILTIN;
int doorDirPin = 4;
int doorStepPin = 5;
int winDirPin = 6;
int winStepPin = 7;
int pumpPin = 9;
int timerPeriod = 15000; // microseconds
int millisbetweenSteps = 10; // milliseconds
volatile int stepperTarget = 0;
volatile int stepperPosition = 0;
volatile int doorDelta = 0;
int oldPosition = 0;
int newPosition = 0;
Encoder myEnc(2, 3);
SerialCommand RasPiCmd;

void setup() {
  pinMode(led, OUTPUT);
  Timer1.initialize(timerPeriod);
  Timer1.attachInterrupt(windowStepper);
  //Timer1.attachInterrupt(doorStepper);
  Wire.begin();
  Serial.begin(9600);
  //Sensor
  writeI2CRegister8bit(0x21, 6); //reset
  //Stepper
  pinMode(winDirPin, OUTPUT);
  pinMode(winStepPin, OUTPUT);
  pinMode(doorDirPin, OUTPUT);
  pinMode(doorStepPin, OUTPUT);
  pinMode(pumpPin, OUTPUT);
  //digitalWrite(pumpPin, HIGH);
  // Setup callbacks for SerialCommand commands 
  RasPiCmd.addCommand("pump", togglePump);       // Toggle water pump   
  RasPiCmd.addCommand("window", setStepperTarget); //set stepper target position
}

//Toggle pump

void togglePump()    
{
  int pumpState;  
  char *arg; 
  arg = RasPiCmd.next(); 
  if (arg != NULL) {
    pumpState=atoi(arg);    // Converts a char string to an integer
    digitalWrite(pumpPin, pumpState);
  } 
}

void setStepperTarget()    
{
  int target;  
  char *arg; 
  arg = RasPiCmd.next(); 
  if (arg != NULL) {
    target=atoi(arg);    
  } 
  stepperTarget = target;
}

//Moisture sensor code
void writeI2CRegister8bit(int addr, int value) {
  Wire.beginTransmission(addr);
  Wire.write(value);
  Wire.endTransmission();
}

unsigned int readI2CRegister16bit(int addr, int reg) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  Wire.endTransmission();
  delay(20);
  Wire.requestFrom(addr, 2);
  unsigned int t = Wire.read() << 8;
  t = t | Wire.read();
  return t;
}

//Stepper code
void windowStepper() {
  int windowDelta = stepperTarget - stepperPosition;;
  if (digitalRead(winStepPin) == 1) {
    digitalWrite(winStepPin, LOW);
  } 
  else if (windowDelta > 0){
    digitalWrite(winDirPin, LOW); 
    digitalWrite(winStepPin, HIGH);
    stepperPosition++;
  } 
  else if (windowDelta < 0){
    digitalWrite(winDirPin, HIGH); 
    digitalWrite(winStepPin, HIGH);
    stepperPosition--;  
  }
}

void doorStepper() {
  if (digitalRead(doorStepPin) == 1) {
    digitalWrite(doorStepPin, LOW);
  } 
  else if (doorDelta > 0){
    digitalWrite(doorDirPin, LOW); 
    digitalWrite(doorStepPin, HIGH);
    doorDelta--;
  } 
  else if (doorDelta < 0){
    digitalWrite(doorDirPin, HIGH); 
    digitalWrite(doorStepPin, HIGH);
    doorDelta++;  
  }
}


long int getEncoderPosition(){
  long int newPosition = myEnc.read(); 
  newPosition = newPosition/4;
  return newPosition;
}

//int getRevsSec

void loop() {
  RasPiCmd.readSerial(); 
  int temp = readI2CRegister16bit(0x21, 5);
  temp = temp/10;
  int moisture = readI2CRegister16bit(0x21, 0);
  newPosition = getEncoderPosition();
  
  int light_level = readI2CRegister16bit(0x21, 3); //request light measurement 
  //Serial.print("Pump "); 
  //digitalWrite(pumpPin, LOW);
  //Serial.println();
  //Serial.print(digitalRead(pumpPin));
  Serial.print("temperature ");  
  Serial.println(temp); 
  //Serial.print("wind speed: ");
  //Serial.println(wind_speed);
  Serial.print("humidity "); //read capacitance register
  Serial.println(moisture);
  Serial.print("light "); //read capacitance register
  Serial.println(light_level);
  //Serial.print("pulses_sec "); //read capacitance register
  //Serial.println(pulses_sec);
  Serial.print("window ");
  Serial.println(stepperPosition);
  oldPosition = newPosition;
  delay(1000);
}




