FROM node:22-bookworm AS build

ARG EXPO_PUBLIC_API_URL

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EAS_BUILD_PROFILE=preview
ENV CI=1
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

RUN apt-get update && apt-get install -y --no-install-recommends openjdk-17-jdk-headless curl unzip ca-certificates && rm -rf /var/lib/apt/lists/*
RUN mkdir -p $ANDROID_HOME/cmdline-tools && curl -fsSL -o /tmp/android-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip && unzip -q /tmp/android-tools.zip -d /tmp/android-tools && mv /tmp/android-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && rm -rf /tmp/android-tools.zip /tmp/android-tools
RUN yes | sdkmanager --licenses >/dev/null && sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

WORKDIR /project
COPY . .
RUN npm ci

WORKDIR /project/apps/mobile
RUN npx expo prebuild --platform android --no-install --clean

WORKDIR /project/apps/mobile/android
RUN chmod +x gradlew && ./gradlew :app:assembleRelease --no-daemon
RUN mkdir -p /project/apps/mobile/dist && cp app/build/outputs/apk/release/app-release.apk /project/apps/mobile/dist/Enturma-Android-0.3.0.apk

FROM node:22-alpine
WORKDIR /app
COPY deploy/android-download/server.cjs ./server.cjs
COPY --from=build /project/apps/mobile/dist/*.apk ./downloads/
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.cjs"]
