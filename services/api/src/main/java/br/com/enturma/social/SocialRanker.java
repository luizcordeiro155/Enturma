package br.com.enturma.social;
import java.util.*;

/** Stable and explainable local ranking; no external model or private-message data. */
public final class SocialRanker {
  private SocialRanker() {}
  public static int score(boolean followed,Collection<String> tags,Set<String> interests) {
    return (followed?30:0)+(int)tags.stream().filter(interests::contains).distinct().count()*12;
  }
  public static void diversify(List<Map<String,Object>> posts) {
    for(int i=2;i<posts.size();i++) {
      Object author=posts.get(i).get("authorId");
      if(author.equals(posts.get(i-1).get("authorId")) && author.equals(posts.get(i-2).get("authorId")))
        for(int j=i+1;j<posts.size();j++) if(!author.equals(posts.get(j).get("authorId"))) { Collections.swap(posts,i,j); break; }
    }
  }
}
