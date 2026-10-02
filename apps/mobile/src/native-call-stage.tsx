import { Platform, View, Text, Pressable, Alert } from "react-native";
import {
  RoomContext,
  VideoTrack,
  useTracks,
  isTrackReference,
} from "@livekit/react-native";
import { Track, type Room } from "livekit-client";
import { useStyles } from "./ui";

export default function NativeCallStageLive({
  room,
  error,
}: {
  room: Room;
  error: string;
}) {
  return (
    <RoomContext.Provider value={room}>
      <Stage room={room} error={error} />
    </RoomContext.Provider>
  );
}

function Stage({ room, error }: { room: Room; error: string }) {
  const styles = useStyles();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  return (
    <View style={{ gap: 12 }}>
      {tracks.filter(isTrackReference).map((t) => (
        <VideoTrack
          key={t.publication.trackSid}
          trackRef={t}
          style={{
            height: t.source === Track.Source.ScreenShare ? 240 : 180,
            borderRadius: 12,
          }}
        />
      ))}

      <View style={{ flexDirection: "row", gap: 18 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void room.localParticipant
              .setCameraEnabled(!room.localParticipant.isCameraEnabled)
              .catch((e: Error) => Alert.alert("Câmera", e.message))
          }
          style={{ padding: 14 }}
        >
          <Text style={styles.text}>Câmera</Text>
        </Pressable>

        {Platform.OS === "android" && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void room.localParticipant
                .setScreenShareEnabled(
                  !room.localParticipant.isScreenShareEnabled,
                )
                .catch((e: Error) =>
                  Alert.alert("Compartilhamento", e.message),
                )
            }
            style={{ padding: 14 }}
          >
            <Text style={styles.text}>Compartilhar tela</Text>
          </Pressable>
        )}
      </View>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
