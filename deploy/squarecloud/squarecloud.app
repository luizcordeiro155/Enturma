DISPLAY_NAME=Enturma API
MAIN=app.jar
RUNTIME=java
VERSION=recommended
MEMORY=1024
AUTORESTART=true
START=java -XX:MaxRAMPercentage=65 -XX:+ExitOnOutOfMemoryError -jar app.jar --spring.profiles.active=squarecloud
