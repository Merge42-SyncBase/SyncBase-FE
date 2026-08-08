# SyncBase frontend

관리자 UI의 HTML template, CSS, JavaScript, PDF.js와 브라우저 복구 테스트를 소유한다. Go `embed.FS`로 WAS binary에 포함되므로 런타임 정적 파일 복사가 필요 없다.

```sh
go test ./...
node --test test/upload-state.test.mjs
```
