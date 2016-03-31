#Introduction

This document describes architectural components of Opengreenhouse project. Components are divided into four main groups: mechanical, electronic, sensors and software. 

#Overview

The system has to provide functionality allowing to monitor and control aspects of a small scale greenhouse:

 * Windows and doors - status and control
 * Air temperature - status
 * Air humidity - status
 * Soil moisture - status
 * Soil temperature - status
 * Watering - status and control
 * Wind safety

##Mechanical components
  
 * Solid window actuator
 * Soft window actuator (for lightweight plastic greenhouses)
 * Solid door actuator
 * Window door open/closed endswitch fixtures
 * Wind speed sensor
 * Pump for watering in environments without pressurised water
 * Valve for watering where pressurised water is available

##Sensors
  
  * Hall effect or reed switch sensor for wind speed 
  * Inside air temperature sensor
  * Inside air humidity sensor
  * Outside temperature sensor
  * Soil moisture sensor
  * Soil temperature sensor
  * Water flow sensor
  * Window closed, window open end switches

 ##Electronic components
 
 * *Air temperature/humidity sensor hub* - houses air temperature and humidity sensors, rovides connectors for soil moisture/temperature sensors, wind speed sensor and outside temperature sensors, provides readings on the communication bus;
 * *Window/door actuator controller* - provides drive power for actuator motors, reads end switches, listens for commands and provides status on the communication bus;
 * *Watering controller* - controlls relay to switch watering pump or valve, reads water flow sensor, listens for commands and provides status on the communication bus;

 ##Software components

 ##Communication protocols
  * Modbus over RS485
  * HTTPS over Wifi