package br.com.enturma.social;
import static org.assertj.core.api.Assertions.*;
import java.util.*;
import org.junit.jupiter.api.Test;
class VideoRecipeTest {
  VideoRecipe recipe(double start,double end) { return new VideoRecipe(List.of(new VideoRecipe.Segment(start,end)),1,.5,.5,0,1,false,0,List.of()); }
  @Test void acceptsNinetySecondsFromALongerOriginal() { assertThat(recipe(60,150).validated(180).duration()).isEqualTo(90); }
  @Test void rejectsOverlongOutputOutOfBoundsAndNonFiniteValues() {
    for(var r:List.of(recipe(0,90.1),recipe(-1,10),recipe(2,1),recipe(0,Double.NaN),recipe(0,91))) assertThatThrownBy(()->r.validated(100)).isInstanceOf(br.com.enturma.common.ApiException.class);
    assertThatThrownBy(()->recipe(20,30).validated(25)).isInstanceOf(br.com.enturma.common.ApiException.class);
  }
  @Test void sumUsesReorderedSegmentsAndRejectsCaptionOutsideExport() {
    var r=new VideoRecipe(List.of(new VideoRecipe.Segment(20,24),new VideoRecipe.Segment(0,4)),1,.5,.5,90,0,true,2,List.of(new VideoRecipe.Caption("Enturma",0,8,.8)));
    assertThat(r.validated(30).duration()).isEqualTo(8);
    assertThatThrownBy(()->new VideoRecipe(r.segments(),1,.5,.5,0,1,false,0,List.of(new VideoRecipe.Caption("Texto",0,9,.8))).validated(30)).isInstanceOf(br.com.enturma.common.ApiException.class);
  }
  @Test void cursorsAreScopedAndRankingUsesDeclaredInterests() {
    var cursor=SocialCursor.read("","following");
    String next=cursor.next("following",Map.of("publishedAt","2026-01-01T00:00:00Z","id",UUID.randomUUID()));
    assertThat(SocialCursor.read(next,"following").snapshot()).isEqualTo(cursor.snapshot());
    assertThatThrownBy(()->SocialCursor.read(next,"campus")).isInstanceOf(br.com.enturma.common.ApiException.class);
    assertThat(SocialRanker.score(false,List.of("java"),Set.of("java"))).isGreaterThan(SocialRanker.score(false,List.of("arte"),Set.of("java")));
  }
}
