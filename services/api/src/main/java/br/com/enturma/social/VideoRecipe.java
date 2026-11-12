package br.com.enturma.social;

import br.com.enturma.common.ApiException;
import java.util.*;

/** Validated edit decision list. Coordinates are fractions of the exported frame. */
public record VideoRecipe(
    List<Segment> segments, double zoom, double x, double y, int rotation,
    double volume, boolean mute, double cover, List<Caption> captions,
    String aspect, String filter, Double speed) {
  public VideoRecipe {
    aspect = aspect == null ? "9:16" : aspect;
    filter = filter == null ? "ORIGINAL" : filter;
    speed = speed == null ? 1.0 : speed;
  }
  /** Old clients and persisted drafts retain exactly their previous defaults. */
  public VideoRecipe(List<Segment> segments,double zoom,double x,double y,int rotation,
      double volume,boolean mute,double cover,List<Caption> captions) {
    this(segments,zoom,x,y,rotation,volume,mute,cover,captions,"9:16","ORIGINAL",1.0);
  }
  public record Segment(double start, double end) {}
  public record Caption(String text,double start,double end,double y,Double x,Integer size,String color) {
    public Caption { x=x==null?.5:x;size=size==null?36:size;color=color==null?"#ffffff":color; }
    public Caption(String text,double start,double end,double y){this(text,start,end,y,.5,36,"#ffffff");}
  }
  public double duration() {return segments.stream().mapToDouble(s->s.end()-s.start()).sum()/speed;}
  public int outputHeight() {
    return switch(aspect){case "4:5"->900;case "3:4"->960;case "1:1"->720;case "1.91:1"->376;default->1280;};
  }
  public VideoRecipe validated(double sourceSeconds) {
    if(segments==null||segments.isEmpty()||segments.size()>12||captions==null||captions.size()>20)
      throw ApiException.invalid("Use de 1 a 12 trechos e at\u00e9 20 textos.");
    for(var s:segments) if(s==null||!finite(s.start(),s.end())||s.start()<0||s.end()>sourceSeconds+.05||s.end()-s.start()<.1)
      throw ApiException.invalid("Um dos cortes est\u00e1 fora do v\u00eddeo original.");
    if(!Set.of("9:16","4:5","3:4","1:1","1.91:1").contains(aspect)
        || !Set.of("ORIGINAL","VIVID","WARM","COOL","MONO","FADE","CONTRAST").contains(filter)
        || !finite(zoom,x,y,volume,cover,sourceSeconds,speed) || speed<.5||speed>2
        ||zoom<1||zoom>3||x<0||x>1||y<0||y>1||volume<0||volume>2
        ||!Set.of(0,90,180,270).contains(rotation)||duration()>90.001||cover<0||cover>=duration())
      throw ApiException.invalid("O resultado deve ter at\u00e9 90 segundos, com enquadramento e \u00e1udio v\u00e1lidos.");
    for(var c:captions) if(c==null||c.text()==null||c.text().isBlank()||c.text().length()>240
        ||c.text().codePoints().anyMatch(v->Character.isISOControl(v)&&v!='\n')
        ||!finite(c.start(),c.end(),c.x(),c.y())||c.start()<0||c.end()>duration()||c.end()<=c.start()
        ||c.x()<0||c.x()>1||c.y()<0||c.y()>1||c.size()<20||c.size()>72||!c.color().matches("#[0-9a-fA-F]{6}"))
      throw ApiException.invalid("Revise os textos e seus tempos de exibi\u00e7\u00e3o.");
    return this;
  }
  private static boolean finite(double... values){return Arrays.stream(values).allMatch(Double::isFinite);}
}
