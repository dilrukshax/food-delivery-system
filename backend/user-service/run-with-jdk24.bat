@echo off
REM Temporary script to run user service with JDK 24 workarounds
cd /d "C:\Users\dilan\IdeaProjects\food-delivery-system\backend\user-service"

REM Set environment variables for JDK 24 compatibility
set JAVA_HOME=C:\Program Files\Java\jdk-24
set MAVEN_OPTS=--add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/sun.nio.ch=ALL-UNNAMED --add-opens java.base/sun.misc=ALL-UNNAMED

REM Try to run using direct Java compilation
echo Compiling Java sources directly...
"%JAVA_HOME%\bin\javac" -cp "target\classes;%USERPROFILE%\.m2\repository\org\springframework\boot\spring-boot-starter\3.4.4\spring-boot-starter-3.4.4.jar;%USERPROFILE%\.m2\repository\org\springframework\spring-core\6.2.6\spring-core-6.2.6.jar" -d target\classes src\main\java\com\foodordering\userservice\*.java src\main\java\com\foodordering\userservice\*\*.java

if %ERRORLEVEL% NEQ 0 (
    echo Direct compilation failed. Please install JDK 17 for best compatibility.
    pause
    exit /b 1
)

REM Run the application
echo Starting application...
"%JAVA_HOME%\bin\java" -cp "target\classes;%USERPROFILE%\.m2\repository\org\springframework\boot\spring-boot-starter\3.4.4\spring-boot-starter-3.4.4.jar" com.foodordering.userservice.UserServiceApplication

pause
