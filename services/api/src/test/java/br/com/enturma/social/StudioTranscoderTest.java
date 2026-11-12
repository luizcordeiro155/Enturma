package br.com.enturma.social;
import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
class StudioTranscoderTest {
 @TempDir Path dir;
 void fixture(String... options)throws Exception {
   var args=new ArrayList<>(List.of("ffmpeg","-nostdin","-y","-v","error"));args.addAll(List.of(options));
   var process=new ProcessBuilder(args).directory(dir.toFile()).redirectError(ProcessBuilder.Redirect.INHERIT).start();
   assertThat(process.waitFor(30,TimeUnit.SECONDS)).isTrue();assertThat(process.exitValue()).isZero();
 }
 @Test void exportsSpeedFramingFilterTimedTextAndUndistortedCover()throws Exception {
   Assumptions.assumeTrue("true".equals(System.getenv("SOCIAL_TEST_FFMPEG")));
   fixture("-f","lavfi","-i","testsrc2=size=180x320:rate=30","-f","lavfi","-i","sine=frequency=440","-t","3","-c:v","libx264","-pix_fmt","yuv420p","-c:a","aac","-f","mp4","source");
   var recipe=new VideoRecipe(List.of(new VideoRecipe.Segment(.5,2.5)),1.2,.3,.6,0,1,false,.3,
       List.of(new VideoRecipe.Caption("Enturma",0,.8,.4,.2,40,"#ffeb3b")),"1:1","MONO",2.0);
   var result=new SocialTranscoder(new ObjectMapper(),"ffmpeg","ffprobe").render(dir,"VIDEO",recipe);
   assertThat(result.durationMs()).isBetween(950,1050);assertThat(result.width()).isEqualTo(720);assertThat(result.height()).isEqualTo(720);
   assertThat(Files.size(result.thumbnail())).isGreaterThan(1000);
 }
 @Test void imageUsesTheSameCropRecipeRatherThanIgnoringThePreview()throws Exception {
   Assumptions.assumeTrue("true".equals(System.getenv("SOCIAL_TEST_FFMPEG")));
   fixture("-f","lavfi","-i","testsrc=size=600x400:rate=1","-frames:v","1","-threads","1","-f","image2","-vcodec","png","source");
   var recipe=new VideoRecipe(List.of(new VideoRecipe.Segment(0,1)),1.3,0,.5,90,1,true,0,List.of(),"4:5","WARM",1.0);
   var result=new SocialTranscoder(new ObjectMapper(),"ffmpeg","ffprobe").render(dir,"IMAGE",recipe);
   assertThat(result.width()).isEqualTo(720);assertThat(result.height()).isEqualTo(900);assertThat(result.mime()).isEqualTo("image/jpeg");
 }
}
