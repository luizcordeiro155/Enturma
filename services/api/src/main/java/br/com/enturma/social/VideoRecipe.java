package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import java.util.*;

/** Edit decision list. Times and captions refer to the exported timeline, never remote URLs. */
public record VideoRecipe(List<Segment> segments, double zoom, double x, double y, int rotation,
                          double volume, boolean mute, double cover, List<Caption> captions) {
  public record Segment(double start, double end) {}
  public record Caption(String text, double start, double end, double y) {}
  public double duration() { return segments.stream().mapToDouble(s -> s.end()-s.start()).sum(); }
  public VideoRecipe validated(double sourceSeconds) {
    if(segments==null || segments.isEmpty() || segments.size()>12 || captions==null || captions.size()>20)
      throw ApiException.invalid("Use de 1 a 12 trechos e até 20 textos.");
    for(var s:segments) if(s==null || !finite(s.start(),s.end()) || s.start()<0 || s.end()>sourceSeconds+.05 || s.end()-s.start()<.1)
      throw ApiException.invalid("Um dos cortes está fora do vídeo original.");
    if(!finite(zoom,x,y,volume,cover,sourceSeconds) || zoom<1 || zoom>3 || x<0 || x>1 || y<0 || y>1 || volume<0 || volume>2 || !Set.of(0,90,180,270).contains(rotation) || duration()>90.001 || cover<0 || cover>=duration())
      throw ApiException.invalid("O resultado deve ter até 90 segundos, com enquadramento e áudio válidos.");
    for(var c:captions) if(c==null || c.text()==null || c.text().isBlank() || c.text().length()>240 || c.text().codePoints().anyMatch(v->Character.isISOControl(v)&&v!='\n') || !finite(c.start(),c.end(),c.y()) || c.start()<0 || c.end()>duration() || c.end()<=c.start() || c.y()<0 || c.y()>1)
      throw ApiException.invalid("Revise os textos e seus tempos de exibição.");
    return this;
  }
  private static boolean finite(double... values) { return Arrays.stream(values).allMatch(Double::isFinite); }
}
