{
  "summary": "Deep research harness — fan-out web searches, fetch sources, adversarially verify claims, synthesize a cited report.",
  "agentCount": 106,
  "logs": [
    "Q: Практическая методичка по тестированию Go-сервисов (backend microservices) по со…",
    "Decomposed into 5 angles: broad/idiomatic-foundations, layered-testing-fakes-determinism, http-transport-testing, postgres-integration-testcontainers, coverage-fuzzing-ci-tooling",
    "postgres-integration-testcontainers: 6 results",
    "http-transport-testing: 6 results",
    "broad/idiomatic-foundations: 6 results",
    "broad/idiomatic-foundations: 4 novel (2 filtered)",
    "coverage-fuzzing-ci-tooling: 6 results",
    "coverage-fuzzing-ci-tooling: 4 novel (2 filtered)",
    "layered-testing-fakes-determinism: 6 results",
    "layered-testing-fakes-determinism: 4 novel (2 filtered)",
    "Fetched 24 sources → 109 claims → verifying top 25",
    "\"Table-driven testing in Go is an idiomatic style (…\": 3-0 ✓",
    "\"t.Parallel() marks a test to run in parallel only …\": 3-0 ✓",
    "\"Subtests via T.Run enable table-driven and hierarc…\": 3-0 ✓",
    "\"The canonical structure is a slice of anonymous st…\": 3-0 ✓",
    "\"Native fuzzing (FuzzXxx(*testing.F)) calls a targe…\": 3-0 ✓",
    "\"Placing tests in a separate '_test' package forces…\": 3-0 ✓",
    "\"Ardan Labs gotraining teaches the table-driven tes…\": 3-0 ✓",
    "\"The course teaches mocking a web server in tests v…\": 3-0 ✓",
    "\"Quartz is a Go library for writing deterministic t…\": 3-0 ✓",
    "\"Ardan Labs demonstrates subtests via t.Run(name, f…\": 3-0 ✓",
    "\"In production code you inject quartz.NewReal() (a …\": 3-0 ✓",
    "\"httptest.NewRecorder() returns a *ResponseRecorder…\": 3-0 ✓",
    "\"httptest.NewRequest(method, target, body) construc…\": 3-0 ✓",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"The recommended entrypoint to start a Postgres tes…\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"A test obtains the database DSN from the running c…\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Testcontainers for Go spins up a real Postgres in …\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Go native fuzzing requires Go 1.18 or later, uses …\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Fuzzing is invoked via the -fuzz flag (e.g. `go te…\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Go supports native fuzzing in its standard toolcha…\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"A fuzz test is a function named FuzzXxx that accep…\": 0-0 (3 abstain) ✗",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[1] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Testcontainers-go Postgres module spins up a real …\": 0-0 (3 abstain) ✗",
    "\"The canonical handler test pattern is: build a req…\": 3-0 ✓",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Для изолированного тестирования HTTP-хендлеров без…\": 2-0 (1 abstain) ✓",
    "parallel[0] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"The module provides a Snapshot/Restore feature so …\": 1-0 (2 abstain) ✗",
    "parallel[2] failed: agent({schema}): subagent completed without calling StructuredOutput (after 2 in-conversation nudges)",
    "\"Go стандартная библиотека тестирует HTTP-роутинг ч…\": 2-0 (1 abstain) ✓",
    "Verify done: 25 claims → 16 confirmed, 9 killed"
  ],
  "result": {
    "question": "Практическая методичка по тестированию Go-сервисов (backend microservices) по современным канонам 2024-2025. Контекст: hexagonal/DDD Go-сервис со слоями domain (value objects, бизнес-инварианты, денежная математика), application (services с портами-интерфейсами, Result/error-пути), adapters (HTTP handlers на net/http 1.22, pgx/Postgres repository, in-memory repo). Нужно понять КАК ПРАВИЛЬНО покрывать тестами каждый слой, с конкретными примерами кода.\n\nПокрыть 7 тем:\n1. ОБЩИЕ ПРИНЦИПЫ Go-тестирования: table-driven tests, subtests (t.Run), t.Parallel, t.Helper, идиоматичная структура _test.go, package foo vs foo_test (black-box), что тестировать а что нет.\n2. DOMAIN-слой: тестирование чистых value objects / инвариантов БЕЗ моков (конструировать напрямую, проверять ошибки), денежная математика, граничные случаи, overflow.\n3. APPLICATION-слой: fakes vs mocks (почему в Go предпочитают рукописные in-memory fakes портам, а не gomock/mockery), инъекция Clock/UUID для детерминизма, тестирование error-путей.\n4. TRANSPORT/HTTP-слой: net/http/httptest (httptest.NewServer, httptest.NewRecorder), тестирование handlers, статус-коды, JSON decode/encode, table-driven для роутов, Go 1.22 ServeMux.\n5. PERSISTENCE/Postgres repository: тестирование pgx-репозиториев — testcontainers-go (реальный Postgres в Docker) vs моки vs in-memory, integration build tags (//go:build integration), очистка/откат между тестами.\n6. ПОКРЫТИЕ и инструменты: go test -cover -race -coverprofile, реалистичные целевые проценты по слоям (domain ~90%+, transport ~70%, adapters ниже), golden files, native fuzzing (Go 1.18+) для денежной/парсинг-логики.\n7. CI: go vet, staticcheck/golangci-lint, go test -race, разделение unit (быстрые) и integration (нужен Docker) тестов.\n\nНужны КОНКРЕТНЫЕ примеры кода (table-driven test, httptest handler test, in-memory fake, testcontainers Postgres setup) и ссылки на авторитетные источники (официальный Go testing package, Dave Cheney, Ardan Labs, testcontainers-go docs, Go blog). Ответ на русском языке.",
    "summary": "Современный канон тестирования Go-сервисов (2024-2025) опирается на стандартную библиотеку и идиомы, а не на тяжёлые фреймворки: table-driven tests (срез анонимных структур с input/expected, перебираемый через t.Run subtests), чёткое разделение black-box (package foo_test) и white-box тестирования, детерминизм через инъекцию абстракций (Clock — например coder/quartz NewReal/NewMock). Для HTTP-слоя канон — net/http/httptest: NewRequest + NewRecorder + handler.ServeHTTP(rr, r) с проверкой rr.Code/rr.Body in-process без сети (так тестирует роутинг сам Go в net/http/serve_test.go); для интеграционных HTTP-кейсов — httptest.NewServer. Для денежной/парсинг-логики применимо native fuzzing (FuzzXxx(*testing.F), seed через F.Add и testdata/fuzz, падающие входы записываются обратно). КЛЮЧЕВОЙ ПРОБЕЛ: ни один из claims о persistence-слое (testcontainers-go для Postgres) не пережил adversarial-верификацию — все были отклонены (0-0/1-0), поэтому конкретика по testcontainers/pgx-репозиториям в этом отчёте НЕ подтверждена и требует первичной проверки документации.",
    "findings": [
      {
        "claim": "Тема 1 (общие принципы): Table-driven testing — это идиоматический стиль (не библиотека), где каждая запись таблицы — полный тест-кейс с input/expected/name; каноническая форма — срез анонимных структур, перебираемый в for-цикле, каждый кейс запускается как subtest через t.Run(). Subtests (T.Run) дают табличные и иерархические тесты без отдельных функций, с уникальным slash-именем; родитель завершается только после всех subtests.",
        "confidence": "high",
        "sources": [
          "https://go.dev/wiki/TableDrivenTests",
          "https://pkg.go.dev/testing"
        ],
        "evidence": "go.dev/wiki/TableDrivenTests дословно: каждая запись — полный тест-кейс с inputs/expected results и именем; код пишется один раз и амортизируется. Канонический пример: var flagtests = []struct{ in string; out string }{...}; for _, tt := range flagtests { t.Run(tt.in, func(t *testing.T){ s := Sprintf(tt.in,...); if s != tt.out { t.Errorf(\"got %q, want %q\", s, tt.out) } }) }. pkg.go.dev/testing: T.Run/B.Run позволяют subtests/sub-benchmarks без отдельных функций, enabling table-driven и hierarchical tests; уникальное имя = top-level + последовательность имён через слеши; parent завершается только когда все subtests завершены.",
        "vote": "3-0"
      },
      {
        "claim": "Тема 1 (управление параллелизмом и структурой): t.Parallel() помечает тест для запуска параллельно ТОЛЬКО с другими параллельными тестами, вызывается только из горутины тест-функции; subtests управляют scope параллелизма. Black-box: размещение тестов в отдельном пакете '_test' заставляет использовать только экспортируемые идентификаторы. t.Cleanup регистрирует teardown в LIFO-порядке; TestMain(m *testing.M) даёт глобальный setup/teardown вокруг m.Run().",
        "confidence": "high",
        "sources": [
          "https://pkg.go.dev/testing"
        ],
        "evidence": "pkg.go.dev/testing дословно: Parallel signals that this test is to be run in parallel with (and only with) other parallel tests; T.Parallel must be called only from the goroutine running the Test function; Subtests can also be used to control parallelism. Black-box: If the test file is in a separate '_test' package... only its exported identifiers may be used. This is known as 'black box' testing. Cleanup: Cleanup functions will be called in last added, first called order (= LIFO). TestMain: can do whatever setup and teardown is necessary around a call to m.Run().",
        "vote": "3-0"
      },
      {
        "claim": "Тема 1/4 (учебный канон Ardan Labs): gotraining учит table-driven как срез анонимных структур (input+expected), перебираемый range, на примере тестирования URL против HTTP статус-кодов; учит subtests через t.Run(name, fn) с шэдоуингом loop-переменных (testID, test := testID, test) от closure-capture багов и t.Parallel() внутри subtest для конкурентности; учит мокать веб-сервер через httptest.NewServer(http.HandlerFunc(f)) с inline-хендлером, defer server.Close() и реальным http.Get(server.URL).",
        "confidence": "high",
        "sources": [
          "https://github.com/ardanlabs/gotraining/tree/master/topics/go/testing/tests",
          "https://www.ardanlabs.com/blog/2023/01/table-driven-tests-in-go.html"
        ],
        "evidence": "example2_test.go дословно: tt := []struct{ url string; statusCode int }{ {\"https://www.ardanlabs.com/blog/index.xml\", http.StatusOK}, {\"http://rss.cnn.com/rss/cnn_topstorie.rss\", http.StatusNotFound} } перебирается for testID, test := range tt. example5_test.go: for testID, test := range tt { testID, test := testID, test; tf := func(t *testing.T){...}; t.Run(test.name, tf) }, в TestParallelize добавлен t.Parallel() внутри tf. example3 (Mocking Web Server Response): return httptest.NewServer(http.HandlerFunc(f)), defer server.Close(), http.Get(server.URL). Caveat: шэдоуинг loop-vars — workaround до Go 1.22 (с 1.22 capture per-iteration автоматический).",
        "vote": "3-0"
      },
      {
        "claim": "Тема 3 (application-слой, детерминизм): каноничный паттерн — инъекция абстракции Clock вместо прямого вызова time.Now() в сервисах. coder/quartz — Go-библиотека для детерминированных time-зависимых unit-тестов (быстрые, не флакают, просто пишутся): в production инъектируется quartz.NewReal() (passthrough к stdlib time), в тестах quartz.NewMock(t) для точного контроля времени.",
        "confidence": "high",
        "sources": [
          "https://github.com/coder/quartz",
          "https://coder.com/blog/introducing-quartz",
          "https://pkg.go.dev/github.com/coder/quartz"
        ],
        "evidence": "README coder/quartz: A Go time testing library for writing deterministic unit tests; цели — тесты execute quickly, don't flake, straightforward to write and understand. Дословно: In production, set this clock to quartz.NewReal()... transparently passes through to the standard time library; в тестах mClock := quartz.NewMock(t). pkg.go.dev: func NewReal() Clock и func NewMock(tb TestingT) *Mock (*testing.T удовлетворяет TestingT). Это именно DI Clock-абстракции вместо time.Now() — well-established Go идиома (предшественник benbjohnson/clock).",
        "vote": "3-0"
      },
      {
        "claim": "Тема 4 (transport/HTTP): httptest.NewRecorder() возвращает *ResponseRecorder, реализующий http.ResponseWriter, и записывает мутации хендлера (статус через Code, тело через Body буфер, заголовки) для in-process тестирования без сетевого сервера. httptest.NewRequest(method, target, body) строит *http.Request для прямой передачи в http.Handler, паникует при ошибке, host по умолчанию example.com, метод по умолчанию GET. Каноничный паттерн теста хендлера: NewRequest -> NewRecorder -> вызов хендлера -> чтение ответа через recorder.Result().",
        "confidence": "high",
        "sources": [
          "https://pkg.go.dev/net/http/httptest"
        ],
        "evidence": "pkg.go.dev/net/http/httptest дословно: ResponseRecorder is an implementation of http.ResponseWriter that records its mutations for later inspection in tests; NewRecorder returns an initialized ResponseRecorder. Поля: Code int (HTTP response code set by WriteHeader), Body *bytes.Buffer, HeaderMap http.Header. NewRequest: returns a new incoming server Request, suitable for passing to an http.Handler for testing; panics on error; относительный target -> host example.com; empty method означает GET. Каноничный пример из доков: req := httptest.NewRequest(\"GET\", \"http://example.com/foo\", nil); w := httptest.NewRecorder(); handler(w, req); resp := w.Result(); body, _ := io.ReadAll(resp.Body). Caveat: Code=0 если WriteHeader не вызван (тогда доки советуют Result()); HeaderMap deprecated в пользу Result().Header.",
        "vote": "3-0"
      },
      {
        "claim": "Тема 4 (transport, эталон stdlib): сама стандартная библиотека Go тестирует HTTP-роутинг table-driven подходом — срез анонимных структур с полями (method, host, path, code, pattern) перебирается в одной тест-функции (TestServeMuxHandler); для изолированного тестирования хендлеров без сети использует httptest.NewRecorder() + h.ServeHTTP(rr, r) и проверяет rr.Code против ожидаемого статус-кода.",
        "confidence": "high",
        "sources": [
          "https://github.com/golang/go/blob/master/src/net/http/serve_test.go",
          "https://pkg.go.dev/net/http/httptest"
        ],
        "evidence": "net/http/serve_test.go: var serveMuxTests = []struct{ method string; host string; path string; code int; pattern string }{...} перебирается for _, tt := range serveMuxTests в TestServeMuxHandler, строит Request на запись и проверяет pattern/code. Паттерн изоляции: rr := httptest.NewRecorder(); h.ServeHTTP(rr, r); if rr.Code != tt.code { t.Errorf(...) }. Каноничный идиом if status := rr.Code; status != http.StatusOK { t.Errorf(...) } документирован Mat Ryer (blog.questionable.services), Twilio, CloudBees. Caveat: голосование 2-0; URL serve_test.go — это server test suite, а не эталонный handler-test example, но сам патторн корректен и документирован независимо.",
        "vote": "2-0"
      },
      {
        "claim": "Тема 6 (fuzzing для денежной/парсинг-логики): native fuzzing — функция FuzzXxx(*testing.F), вызывающая target со случайно сгенерированными входами; seed-входы из F.Add или файлов testdata/fuzz/<Name>, падающие входы автоматически записываются обратно в эту директорию. Поддерживаемые типы входов: string, []byte и набор numeric/bool/byte/rune (int, int8..int64, uint, uint8..uint64, float32, float64, bool, byte, rune) — релевантно для денежной/парсинг-логики.",
        "confidence": "high",
        "sources": [
          "https://pkg.go.dev/testing"
        ],
        "evidence": "pkg.go.dev/testing дословно: Seed inputs may be registered by calling F.Add or by storing files in the directory testdata/fuzz/<Name>... If the fuzz target fails for a given input, the fuzzing engine writes the inputs that caused the failure to a file in the directory testdata/fuzz/<Name>. Официальный список поддерживаемых типов: []byte, string, bool, byte, rune, float32, float64, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64 — полностью покрывает заявленный набор. Native fuzzing GA с Go 1.18. Caveat: при read-only директории fallback в build cache — не противоречит claim.",
        "vote": "3-0"
      }
    ],
    "caveats": "КРИТИЧЕСКИЙ ПРОБЕЛ — Тема 5 (Persistence/Postgres repository) НЕ ПОКРЫТА: все 5 claims о testcontainers-go (postgres.Run vs устаревший RunContainer, Snapshot/Restore для очистки между тестами, ConnectionString/DSN, функциональные опции WithImage/WithDatabase/WithInitScripts) были ОТКЛОНЕНЫ при adversarial-верификации (голоса 0-0 и 1-0). Это означает не то, что они ложны, а то, что верификаторы не смогли подтвердить их по первичным источникам в отведённое время. Конкретику по тестированию pgx-репозиториев (testcontainers vs in-memory vs моки, integration build tags //go:build integration, очистка/откат между тестами) НЕОБХОДИМО проверить отдельно по актуальной документации golang.testcontainers.org/modules/postgres — API testcontainers-go активно менялся (RunContainer -> Run), что и могло сорвать верификацию.\n\nЧАСТИЧНО ПОКРЫТЫЕ ТЕМЫ: Тема 2 (domain-слой: value objects/инварианты без моков, денежная математика, overflow, граничные случаи) НЕ имеет отдельных подтверждённых claims — покрывается косвенно через общие принципы table-driven (Тема 1) и fuzzing (Тема 6), но конкретных примеров тестирования денежной математики/overflow в подтверждённых claims нет. Тема 3 подтверждена только в части инъекции Clock; почему в Go предпочитают рукописные in-memory fakes портам вместо gomock/mockery, и инъекция UUID — НЕ имеют подтверждённых claims. Тема 6 в части целевых процентов покрытия по слоям (domain ~90%, transport ~70%), go test -cover/-race/-coverprofile, golden files — НЕ подтверждена claims. Тема 7 (CI: go vet, staticcheck/golangci-lint, разделение unit/integration) — полностью БЕЗ подтверждённых claims.\n\nВРЕМЕННАЯ ЧУВСТВИТЕЛЬНОСТЬ: шэдоуинг loop-переменных (testID, test := testID, test) — workaround до Go 1.22; с Go 1.22 захват переменной цикла per-iteration автоматический, поэтому в новом коде шэдоуинг избыточен. HeaderMap у ResponseRecorder deprecated в пользу Result().Header. Все подтверждённые claims основаны на первичных официальных источниках (pkg.go.dev, go.dev/wiki, golang/go репозиторий, ardanlabs/gotraining, coder/quartz) — качество источников высокое.",
    "openQuestions": [
      "Тема 5 (главный пробел): каков актуальный канон тестирования pgx/Postgres-репозиториев в 2024-2025 — точный API testcontainers-go postgres-модуля (postgres.Run vs RunContainer, ConnectionString, Snapshot/Restore), паттерн integration build tags //go:build integration, и стратегия очистки/отката (truncate/transaction rollback) между тестами? Требует прямой проверки golang.testcontainers.org.",
      "Тема 3: почему именно в Go-сообществе предпочитают рукописные in-memory fakes, реализующие порты-интерфейсы, вместо сгенерированных моков (gomock/mockery) — есть ли авторитетный первоисточник (Dave Cheney, Go blog, Ardan Labs), формулирующий это как канон? И как канонично инъектировать UUID-генератор для детерминизма?",
      "Тема 6: какие реалистичные целевые проценты покрытия по слоям рекомендуют авторитетные источники (domain ~90%+, transport ~70%, adapters ниже) и как именно применять golden files в Go (testdata/, флаг -update) — это формулировки из задания, но без подтверждённых первоисточников.",
      "Тема 7 (CI): каков современный канон CI-пайплайна для Go — конкретные конфигурации go vet, staticcheck/golangci-lint, go test -race, и идиоматичное разделение быстрых unit-тестов от integration (требующих Docker) через build tags и отдельные make-таргеты?"
    ],
    "refuted": [
      {
        "claim": "Testcontainers-go Postgres module spins up a real Postgres container via the entrypoint function postgres.Run(ctx, img, opts...); the older RunContainer is deprecated and will be removed in the next major release.",
        "vote": "0-0",
        "source": "https://golang.testcontainers.org/modules/postgres/"
      },
      {
        "claim": "The module provides a Snapshot/Restore feature so each test gets a clean database without recreating the container or running heavy cleanup scripts: call Snapshot(ctx) once after setup, then Restore(ctx) in each test's cleanup.",
        "vote": "1-0",
        "source": "https://golang.testcontainers.org/modules/postgres/"
      },
      {
        "claim": "The recommended entrypoint to start a Postgres test container is postgres.Run(ctx, img, opts...) which takes an image string (e.g. \"postgres:16-alpine\") and returns (*PostgresContainer, error); the older postgres.RunContainer is deprecated.",
        "vote": "0-0",
        "source": "https://pkg.go.dev/github.com/testcontainers/testcontainers-go/modules/postgres"
      },
      {
        "claim": "A test obtains the database DSN from the running container via the ConnectionString method, which returns the connection string for the default 5432 port and accepts variadic extra args such as connect_timeout=10.",
        "vote": "0-0",
        "source": "https://pkg.go.dev/github.com/testcontainers/testcontainers-go/modules/postgres"
      },
      {
        "claim": "Testcontainers for Go spins up a real Postgres in Docker via the postgres module using functional options (WithImage, WithDatabase, WithUsername, WithPassword, WithInitScripts), enabling integration tests against the same database type used in production instead of mocks.",
        "vote": "0-0",
        "source": "https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/"
      },
      {
        "claim": "Go native fuzzing requires Go 1.18 or later, uses FuzzXxx-named functions taking *testing.F, with f.Add for seed corpus and f.Fuzz with a target function that receives *testing.T plus the fuzzed argument types.",
        "vote": "0-0",
        "source": "https://go.dev/doc/tutorial/fuzz"
      },
      {
        "claim": "Fuzzing is invoked via the -fuzz flag (e.g. `go test -fuzz=Fuzz`), can be time-limited with -fuzztime (e.g. `-fuzztime 30s`), and a plain `go test` runs only the seed inputs without active fuzzing.",
        "vote": "0-0",
        "source": "https://go.dev/doc/tutorial/fuzz"
      },
      {
        "claim": "Go supports native fuzzing in its standard toolchain beginning with Go 1.18, available via the standard go test tooling.",
        "vote": "0-0",
        "source": "https://go.dev/doc/security/fuzz/"
      },
      {
        "claim": "A fuzz test is a function named FuzzXxx that accepts only a *testing.F and returns nothing; the fuzz target is a call to (*testing.F).Fuzz taking *testing.T as the first parameter followed by the fuzzing arguments.",
        "vote": "0-0",
        "source": "https://go.dev/doc/security/fuzz/"
      }
    ],
    "sources": [
      {
        "url": "https://go.dev/wiki/TableDrivenTests",
        "quality": "primary",
        "angle": "broad/idiomatic-foundations",
        "claimCount": 4
      },
      {
        "url": "https://dave.cheney.net/2019/05/07/prefer-table-driven-tests",
        "quality": "blog",
        "angle": "broad/idiomatic-foundations",
        "claimCount": 3
      },
      {
        "url": "https://pkg.go.dev/testing",
        "quality": "primary",
        "angle": "broad/idiomatic-foundations",
        "claimCount": 5
      },
      {
        "url": "https://github.com/ardanlabs/gotraining/tree/master/topics/go/testing/tests",
        "quality": "primary",
        "angle": "broad/idiomatic-foundations",
        "claimCount": 5
      },
      {
        "url": "https://quii.gitbook.io/learn-go-with-tests/testing-fundamentals/working-without-mocks",
        "quality": "secondary",
        "angle": "layered-testing-fakes-determinism",
        "claimCount": 5
      },
      {
        "url": "https://rednafi.com/go/mocking-libraries-bleh/",
        "quality": "blog",
        "angle": "layered-testing-fakes-determinism",
        "claimCount": 5
      },
      {
        "url": "https://github.com/coder/quartz",
        "quality": "primary",
        "angle": "layered-testing-fakes-determinism",
        "claimCount": 5
      },
      {
        "url": "https://leapcell.io/blog/mastering-mocking-in-go-gomock-vs-interface-based-fakes",
        "quality": "blog",
        "angle": "layered-testing-fakes-determinism",
        "claimCount": 5
      },
      {
        "url": "https://pkg.go.dev/net/http/httptest",
        "quality": "primary",
        "angle": "http-transport-testing",
        "claimCount": 5
      },
      {
        "url": "https://blog.questionable.services/article/testing-http-handlers-go/",
        "quality": "blog",
        "angle": "http-transport-testing",
        "claimCount": 5
      },
      {
        "url": "https://www.willem.dev/articles/testing-http-handlers-using-httptest/",
        "quality": "blog",
        "angle": "http-transport-testing",
        "claimCount": 5
      },
      {
        "url": "https://quii.gitbook.io/learn-go-with-tests/build-an-application/http-server",
        "quality": "secondary",
        "angle": "http-transport-testing",
        "claimCount": 5
      },
      {
        "url": "https://github.com/golang/go/blob/master/src/net/http/serve_test.go",
        "quality": "primary",
        "angle": "http-transport-testing",
        "claimCount": 5
      },
      {
        "url": "https://backendbytes.com/articles/go-testing-best-practices/",
        "quality": "unreliable",
        "angle": "http-transport-testing",
        "claimCount": 0
      },
      {
        "url": "https://golang.testcontainers.org/modules/postgres/",
        "quality": "primary",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 5
      },
      {
        "url": "https://pkg.go.dev/github.com/testcontainers/testcontainers-go/modules/postgres",
        "quality": "primary",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 5
      },
      {
        "url": "https://kashifsoofi.github.io/integrationtest/postgres/go/integration-test-postgres-with-testcontainers-go/",
        "quality": "blog",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 5
      },
      {
        "url": "https://dev.to/remast/go-integration-tests-using-testcontainers-9o5",
        "quality": "blog",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 4
      },
      {
        "url": "https://storj.dev/blog/go-integration-tests-with-postgres",
        "quality": "blog",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 5
      },
      {
        "url": "https://testcontainers.com/guides/getting-started-with-testcontainers-for-go/",
        "quality": "primary",
        "angle": "postgres-integration-testcontainers",
        "claimCount": 4
      },
      {
        "url": "https://go.dev/doc/tutorial/fuzz",
        "quality": "primary",
        "angle": "coverage-fuzzing-ci-tooling",
        "claimCount": 5
      },
      {
        "url": "https://go.dev/doc/security/fuzz/",
        "quality": "primary",
        "angle": "coverage-fuzzing-ci-tooling",
        "claimCount": 5
      },
      {
        "url": "https://go.dev/doc/build-cover",
        "quality": "primary",
        "angle": "coverage-fuzzing-ci-tooling",
        "claimCount": 5
      },
      {
        "url": "https://github.com/golangci/golangci-lint",
        "quality": "primary",
        "angle": "coverage-fuzzing-ci-tooling",
        "claimCount": 4
      }
    ],
    "stats": {
      "angles": 5,
      "sourcesFetched": 24,
      "claimsExtracted": 109,
      "claimsVerified": 25,
      "confirmed": 16,
      "killed": 9,
      "afterSynthesis": 7,
      "urlDupes": 0,
      "budgetDropped": 6,
      "agentCalls": 106
    }
  }
}