@echo off
SonarScanner.MSBuild.exe begin /k:"Helix" /d:sonar.login=b1e0580e3877ef690a2b709e242b75d6ac2cc6e5 /d:sonar.host.url=http://habitat.dev.local:9000/ 
MSBuild.exe SC_Mars.US_Petcare.sln /t:Rebuild
REM commented out because we don't need to post every time locally
REM SonarScanner.MSBuild.exe end 