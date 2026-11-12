package br.com.enturma.social;
import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
class StudioRecipeTest {
  final ObjectMapper json=new ObjectMapper();
  final String base="{\"segments\":[{\"start\":60,\"end\":150}],\"zoom\":1,\"x\":0.5,\"y\":0.5,\"rotation\":0,\"volume\":1,\"mute\":false,\"cover\":2,\"captions\":[]";
  @Test void acceptsBackwardCompatibleRecipesAndSpeedAdjustedOutput() throws Exception {
    assertThat(json.readValue(base+"}",VideoRecipe.class).validated(180).duration()).isEqualTo(90);
    var edited=json.readValue(base+",\"aspect\":\"4:5\",\"filter\":\"MONO\",\"speed\":2}",VideoRecipe.class).validated(180);
    assertThat(edited.duration()).isEqualTo(45);
  }
  @Test void rejectsFilterInjectionAndUnsafeSpeed() {
    for(String settings:new String[]{"\"filter\":\"movie=https://evil.invalid\"","\"aspect\":\"999999:1\"","\"speed\":0","\"speed\":0.5"})
      assertThatThrownBy(()->json.readValue(base+","+settings+"}",VideoRecipe.class).validated(180)).isInstanceOf(Exception.class);
  }
  @Test void acceptsPositionedTimedTextButRejectsInvalidCoordinates() throws Exception {
    String prefix=base.substring(0,base.length()-2);
    var valid=json.readValue(prefix+"[{\"text\":\"Enturma\",\"start\":0,\"end\":5,\"x\":0.3,\"y\":0.4,\"size\":44,\"color\":\"#ffeb3b\"}]}",VideoRecipe.class);
    assertThat(valid.validated(180)).isNotNull();
    assertThatThrownBy(()->json.readValue(prefix+"[{\"text\":\"Teste\",\"start\":0,\"end\":5,\"x\":2,\"y\":0.4}]}",VideoRecipe.class).validated(180)).isInstanceOf(Exception.class);
  }
}
