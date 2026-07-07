// PostgREST `in` 필터용 문자열: ["a","b"] → "(a,b)".
export function toPostgrestInFilter(values: string[]) {
  return `(${values.join(",")})`;
}
