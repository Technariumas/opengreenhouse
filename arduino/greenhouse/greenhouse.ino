#include <Wire.h>
#include <Encoder.h>
#include <TimerOne.h>
#include <SerialCommand.h>

int winDirPin = 4;
int winStepPin = 5;
int doorDirPin = 6;
int doorStepPin = 7;
int pumpPin = 9;
int timerPeriod = 15000; // microseconds
volatile int windowTarget = 0;
volatile int windowPosition = 0;
volatile int doorTarget = 0;
volatile int doorPosition = 0;
int pumpTimeLeft = 0;
Encoder myEnc(2, 3);
SerialCommand RasPiCmd;

void setup() {
  Timer1.initialize(timerPeriod);
  Timer1.attachInterrupt(stepperInterrupt);

  Wire.begin();
  Serial.begin(112500);

  // Reset humidity sensor
  writeI2CRegister8bit(0x21, 6);

  // Steppers
  pinMode(winDirPin, OUTPUT);
  pinMode(winStepPin, OUTPUT);
  pinMode(doorDirPin, OUTPUT);
  pinMode(doorStepPin, OUTPUT);

  pinMode(pumpPin, OUTPUT);

  // Setup callbacks for SerialCommand commands 
  RasPiCmd.addCommand("pump", cmdPump);
  RasPiCmd.addCommand("window", cmdWindow);
  RasPiCmd.addCommand("door", cmdDoor);
}

void cmdPump() {
  char *arg; 
  arg = RasPiCmd.next(); 
  if (arg != NULL) {
    pumpTimeLeft = atoi(arg);
  } 
}

void cmdWindow() {
  char *arg; 
  arg = RasPiCmd.next(); 
  if (arg != NULL) {
    windowTarget = atoi(arg);
  } 
}

void cmdDoor() {
  char *arg; 
  arg = RasPiCmd.next(); 
  if (arg != NULL) {
    doorTarget = atoi(arg);
  } 
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


void stepperInterrupt() {
  int windowDelta = windowTarget - windowPosition;;
  if (digitalRead(winStepPin) == 1) {
    digitalWrite(winStepPin, LOW);
  } 
  else if (windowDelta > 0){
    digitalWrite(winDirPin, LOW); 
    digitalWrite(winStepPin, HIGH);
    windowPosition++;
  } 
  else if (windowDelta < 0){
    digitalWrite(winDirPin, HIGH); 
    digitalWrite(winStepPin, HIGH);
    windowPosition--;  
  }

  int doorDelta = doorTarget - doorPosition;;
  if (digitalRead(winStepPin) == 1) {
    digitalWrite(winStepPin, LOW);
  } 
  else if (doorDelta > 0){
    digitalWrite(winDirPin, LOW); 
    digitalWrite(winStepPin, HIGH);
    doorPosition++;
  } 
  else if (doorDelta < 0){
    digitalWrite(winDirPin, HIGH); 
    digitalWrite(winStepPin, HIGH);
    doorPosition--;  
  }
}

long int windSpeed(){
  long int pos = myEnc.read();
  myEnc.write(0);
  return pos / 4;
}

void loop() {
  RasPiCmd.readSerial(); 

  if (pumpTimeLeft > 0) {
    digitalWrite(pumpPin, HIGH);
    pumpTimeLeft--;
  } else {
    digitalWrite(pumpPin, LOW);
  }

  int temp = readI2CRegister16bit(0x21, 5);
  int moisture = readI2CRegister16bit(0x21, 0);
  int lightLevel = readI2CRegister16bit(0x21, 3);

  Serial.print("temp ");  
  Serial.println(temp); 
  Serial.print("humidity ");
  Serial.println(moisture);
  Serial.print("light ");
  Serial.println(lightLevel);
  Serial.print("wind ");
  Serial.println(windSpeed());
  Serial.print("window ");
  Serial.println(windowPosition);
  Serial.print("door ");
  Serial.println(doorPosition);
  Serial.print("pump ");
  Serial.println(pumpTimeLeft);

  delay(1000);
}




