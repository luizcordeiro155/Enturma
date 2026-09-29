package br.com.enturma.common;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class Db {
  public final JdbcTemplate jdbc;

  public Db(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public Map<String, Object> one(String sql, Object... args) {
    return list(sql, args).stream().findFirst().orElseThrow(ApiException::missing);
  }

  public List<Map<String, Object>> list(String sql, Object... args) {
    return jdbc.query(
        sql,
        (rs, n) -> {
          Map<String, Object> row = new LinkedHashMap<>();
          for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
            String key = rs.getMetaData().getColumnLabel(i);
            StringBuilder camel = new StringBuilder();
            boolean upper = false;
            for (char c : key.toCharArray()) {
              if (c == '_') upper = true;
              else {
                camel.append(upper ? Character.toUpperCase(c) : c);
                upper = false;
              }
            }
            Object value = rs.getObject(i);
            if (value instanceof java.sql.Timestamp t) value = t.toInstant().toString();
            if (value instanceof java.sql.Date d) value = d.toLocalDate().toString();
            row.put(camel.toString(), value);
          }
          return row;
        },
        args);
  }

  public boolean exists(String sql, Object... args) {
    return Boolean.TRUE.equals(jdbc.queryForObject(sql, Boolean.class, args));
  }

  public static int offset(int page) {
    return Math.clamp(page, 0, 10000) * 30;
  }
}
