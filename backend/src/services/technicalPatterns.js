/**
 * Technical Keyword Patterns
 * 
 * Comprehensive list of technical keywords for matching resumes and job descriptions.
 * This is a static list that can be imported and used across the application.
 * 
 * Usage:
 *   const { TECHNICAL_PATTERNS } = require('./technicalPatterns');
 *   const keywords = extractKeywords(text, TECHNICAL_PATTERNS);
 */

/**
 * Comprehensive technical keyword patterns
 * Includes programming languages, frameworks, tools, cloud services, databases, etc.
 */
 const TECHNICAL_PATTERNS = [
// ============================================================
    // 💻 PROGRAMMING LANGUAGES — COMPREHENSIVE SUPERSET
    // ============================================================
    // ⚠️ LEGEND:
    //   [SAFE]    — word is unique enough, \b boundary works fine
    //   [CAREFUL] — common English word; needs context guard or longer form
    //   [CONTEXT] — only match when paired with "language", "programming", "code", etc.

    // ─── Mainstream / Industry Standard ───
    '\\bpython\\b',           // [SAFE]
    '\\bjava\\b',             // [SAFE] (rare false-pos: "Java coffee" in non-tech text)
    '\\bjavascript\\b',       // [SAFE]
    '\\btypescript\\b',       // [SAFE]
    '\\bc\\+\\+\\b',          // [SAFE]
    '\\bc#\\b',               // [SAFE]
    '\\bcsharp\\b',           // [SAFE] alias
    '\\bruby\\b',             // [CAREFUL] — gemstone name; use in tech context
    '\\bphp\\b',              // [SAFE]
    '\\bswift\\b',            // [CAREFUL] — adjective; prefer "swift language" or context
    '\\bkotlin\\b',           // [SAFE]
    '\\bgo\\b',               // [CONTEXT] — extremely common word; use "go language" or "golang"
    '\\bgolang\\b',           // [SAFE] — preferred alias for Go
    '\\brust\\b',             // [CAREFUL] — common word; context-check recommended
    '\\bscala\\b',            // [SAFE]
    '\\bmatlab\\b',           // [SAFE]
    '\\bdart\\b',             // [CAREFUL] — also a sport; tech context recommended

    // ─── R Language (special-cased) ───
    '\\br language\\b',
    '\\br programming\\b',
    '\\br studio\\b',         // RStudio is a near-certain R signal
    '\\btidyverse\\b',        // R ecosystem keyword — strong signal
    '\\bggplot\\b',           // R-specific library — strong signal

    // ─── Systems & Low-Level ───
    '\\bc language\\b',       // Disambiguate plain "C"
    '\\bc programming\\b',
    '\\bassembly language\\b',
    '\\basm\\b',              // [CAREFUL] — abbreviation; context helps
    '\\bvhdl\\b',             // [SAFE]
    '\\bverilog\\b',          // [SAFE]
    '\\bsystemverilog\\b',    // [SAFE]
    '\\bzig\\b',              // [CONTEXT] — very short; use "zig language" or "zig programming"
    '\\bzig language\\b',
    '\\bnim\\b',              // [CONTEXT] — short word; "nim language" preferred
    '\\bnim language\\b',
    '\\bada\\b',              // [CONTEXT] — also a name; "ada language" or "ada programming" safer
    '\\bada language\\b',
    '\\bforth\\b',            // [CONTEXT] — also preposition; "forth language" safer
    '\\bforth language\\b',
    '\\bfortran\\b',          // [SAFE]
    '\\bcobol\\b',            // [SAFE]
    '\\bpascal\\b',           // [CAREFUL] — also a name; context helps
    '\\bpascal language\\b',
    '\\bdelphi\\b',           // [SAFE] — Object Pascal IDE/dialect

    // ─── JVM / Functional ───
    '\\bclojure\\b',          // [SAFE]
    '\\bgroovy\\b',           // [CAREFUL] — slang word; tech context recommended
    '\\belixir\\b',           // [CAREFUL] — also a word; "elixir language" safer
    '\\belixir language\\b',
    '\\berlang\\b',           // [SAFE]
    '\\bhaskell\\b',          // [SAFE]
    '\\bocaml\\b',            // [SAFE]
    '\\bf#\\b',               // [SAFE]
    '\\bfsharp\\b',           // [SAFE] alias
    '\\bsml\\b',              // [CAREFUL] — acronym overlap; context recommended
    '\\bstandard ml\\b',
    '\\bpurescript\\b',       // [SAFE]        // [CONTEXT] — common word; use "reasonml" instead
    '\\breasonml\\b',         // [SAFE]
    '\\belm\\b',              // [CONTEXT] — also a tree; "elm language" or "elm frontend" safer
    '\\belm language\\b',
    '\\blisp\\b',             // [SAFE]
    '\\bcommon lisp\\b',
    '\\bscheme\\b',           // [CAREFUL] — also a noun; "scheme language" safer
    '\\bscheme language\\b',
    '\\bracket\\b',           // [CONTEXT] — very common word; "racket language" or "racket lang" safer
    '\\bracket language\\b',

    // ─── Scripting & Shell ───
    '\\bbash\\b',             // [SAFE]
    '\\bzsh\\b',              // [SAFE]
    '\\bsh script\\b',
    '\\bshell script\\b',
    '\\bpowershell\\b',       // [SAFE]
    '\\bperl\\b',             // [SAFE]
    '\\blua\\b',              // [CAREFUL] — also a name; context helps
    '\\blua scripting\\b',
    '\\btcl\\b',              // [CONTEXT] — short; "tcl scripting" or "tcl language" safer
    '\\btcl language\\b',
    '\\bawk\\b',              // [SAFE]
    '\\bsed\\b',              // [CONTEXT] — very common English word; only match in tech context
    '\\bgroovyscript\\b',

    // ─── Web & Frontend DSLs ───
    '\\bhtml\\b',             // [SAFE] — often co-listed with JS/CSS as a skill
    '\\bcss\\b',              // [SAFE]
    '\\bsass\\b',             // [SAFE]
    '\\bless\\b',             // [CONTEXT] — extremely common word; use "less css" or "less stylesheet"
    '\\bless css\\b',
    '\\bwebassembly\\b',      // [SAFE]
    '\\bwasm\\b',             // [SAFE]
    '\\bcoffeescript\\b',     // [SAFE]

    // ─── Data / Scientific / Statistical ───
    '\\bjulia\\b',            // [CAREFUL] — also a name; tech context recommended
    '\\bjulia language\\b',
    '\\bjulia programming\\b',
    '\\bsas\\b',              // [CONTEXT] — abbreviation; "sas programming" or "sas language" safer
    '\\bsas programming\\b',
    '\\bspss\\b',             // [SAFE]
    '\\bstata\\b',            // [SAFE]
    '\\bsql\\b',              // [SAFE]
    '\\bplsql\\b',            // [SAFE]
    '\\bpl\\/sql\\b',         // [SAFE] alternate format
    '\\btsql\\b',             // [SAFE]
    '\\bt-sql\\b',
    '\\bnosql\\b',            // [SAFE]
    '\\bcypher\\b',           // [CAREFUL] — cipher/cypher; "cypher query" is clearer
    '\\bcypher query\\b',     // Neo4j query language

    // ─── Mobile ───
    '\\bobject-c\\b',         // [SAFE]
    '\\bobjective-c\\b',      // [SAFE]
    '\\bflutter\\b',          // [SAFE] — Dart-based, strong mobile signal
    '\\bxamarin\\b',          // [SAFE]

    // ─── Markup / Config / Template (often listed as skills) ───
    '\\bjson\\b',             // [SAFE]
    '\\byaml\\b',             // [SAFE]
    '\\btoml\\b',             // [SAFE]
    '\\bxml\\b',              // [SAFE]
    '\\blatex\\b',            // [SAFE]
    '\\bmarkdown\\b',         // [SAFE]
    '\\bjinja\\b',            // [SAFE]
    '\\bjinja2\\b',
    '\\bhandlebars\\b',       // [SAFE]
    '\\bmustache\\b',         // [CAREFUL] — also facial hair; tech context recommended

    // ─── Query / Domain-Specific ───
    '\\bgraphql\\b',          // [SAFE]
    '\\bsparql\\b',           // [SAFE]
    '\\bxquery\\b',           // [SAFE]
    '\\bxpath\\b',            // [SAFE]
    '\\bregex\\b',            // [SAFE]
    '\\bregular expression\\b',
    '\\bprolog\\b',           // [SAFE]
    '\\bdatalog\\b',          // [SAFE]

    // ─── Emerging / Modern ───
    '\\bmojo\\b',             // [CONTEXT] — slang word; "mojo language" or "mojo programming" preferred
    '\\bmojo language\\b',
    '\\bcarbon\\b',           // [CONTEXT] — very common word; "carbon language" (Google's lang) preferred
    '\\bcarbon language\\b',
    '\\bv language\\b',       // Vlang
    '\\bvlang\\b',            // [SAFE]
    '\\bcrystal\\b',          // [CONTEXT] — also a gemstone; "crystal language" or "crystal lang" preferred
    '\\bcrystal language\\b',
    '\\bcoffee\\b',           // ❌ DON'T USE — too generic; use \\bcoffeescript\\b
    '\\bsolidity\\b',         // [SAFE] — blockchain/Ethereum smart contracts
    '\\bvyper\\b',            // [SAFE] — Ethereum language
    '\\bmove\\b',             // [CONTEXT] — common verb; "move language" or "move blockchain" safer
    '\\bmove language\\b',    // Sui/Aptos blockchain lang
    '\\bcadence\\b',          // [CONTEXT] — also rhythm; "cadence language" or "flow cadence" safer
    '\\bcadence language\\b', // Flow blockchain lang

    // ============================================================
    // 🌐 FRONTEND — COMPREHENSIVE SUPERSET
    // ============================================================

    // ─── Core Web Technologies ───
    '\\bhtml\\b', '\\bhtml5\\b',
    '\\bcss\\b', '\\bcss3\\b',
    '\\bsass\\b', '\\bscss\\b', '\\bless css\\b',
    '\\bstyled.components\\b', '\\bcss.in.js\\b',
    '\\bshadcn\\b', '\\bradix ui\\b',
    '\\bheadlessui\\b', '\\bdaisyui\\b',
    '\\bantd\\b', '\\bant design\\b',
    'tailwind', '\\btailwindcss\\b',
    'bootstrap', 'material ui', '\\bmui\\b',
    'chakra ui', '\\bfluent ui\\b',
    '\\bprime react\\b', '\\bprimeui\\b',
    '\\bsemantic ui\\b', '\\bbulma\\b',
    '\\bfoundation css\\b',

    // ─── React Ecosystem ───
    '\\breact\\b', 'react\\.js', 'reactjs',
    'next\\.js', 'nextjs', '\\bnext js\\b',
    '\\breact native\\b',
    '\\bexpo\\b',                            // [CAREFUL] — also a trade show; tech context helps
    '\\breact router\\b',
    '\\btanstack\\b', '\\breact query\\b',
    '\\bswr\\b',                             // [SAFE] — data fetching lib
    '\\bgatsby\\b',                          // [SAFE]
    '\\bremix\\b',                           // [CAREFUL] — also a music term; "remix framework" safer
    '\\bremix framework\\b',
    '\\bstorybook\\b',
    '\\bframer motion\\b',
    '\\bgsap\\b',                            // [SAFE] — animation library

    // ─── State Management ───
    '\\bredux\\b', '\\bredux toolkit\\b', '\\brtk\\b',
    '\\bzustand\\b',
    '\\brecoil\\b',
    '\\bmobx\\b',
    '\\bxstate\\b',
    '\\bjotai\\b',
    '\\bvaltio\\b',
    '\\bpinia\\b',                           // Vue state manager
    '\\bvuex\\b',

    // ─── Vue Ecosystem ───
    '\\bvue\\b', 'vue\\.js', 'vuejs',
    'nuxt\\.js', 'nuxtjs', '\\bnuxt\\b',
    '\\bvuetify\\b',
    '\\bquasar\\b',                          // [CAREFUL] — also an astronomy term
    '\\bquasar framework\\b',

    // ─── Angular Ecosystem ───
    '\\bangular\\b', 'angular\\.js', 'angularjs',
    '\\bangular material\\b',
    '\\bngrx\\b',
    '\\bngxs\\b',
    '\\bionic\\b',                           // [CAREFUL] — also a brand; "ionic framework" safer
    '\\bionic framework\\b',

    // ─── Other Frontend Frameworks ───
    '\\bsvelte\\b',
    '\\bsveltekit\\b',
    '\\bsolid\\b',                           // [CONTEXT] — common word; "solid.js" or "solidjs" safer
    'solid\\.js', 'solidjs',
    '\\bqwik\\b',
    '\\blit\\b',                             // [CONTEXT] — slang; "lit element" or "lit web components" safer
    '\\blit element\\b',
    '\\balpine\\.js\\b', '\\balpinejs\\b',
    '\\bhtmx\\b',
    '\\bastro\\b',                           // [CONTEXT] — also astronomy; "astro framework" safer
    '\\bastro framework\\b',
    '\\bastro\\.build\\b',
    '\\bember\\b',                           // [CAREFUL] — also fire ember; "ember.js" safer
    'ember\\.js', 'emberjs',
    '\\bbackbone\\b',                        // [CAREFUL] — also anatomy; "backbone.js" safer
    'backbone\\.js',

    // ─── Build Tools & Bundlers ───
    '\\bwebpack\\b',
    '\\bvite\\b',                            // [CAREFUL] — French word; "vite build" or context helps
    '\\bbabel\\b',
    '\\brollup\\b',
    '\\bparcel\\b',                          // [CAREFUL] — also a package; tech context helps
    '\\besbuild\\b',
    '\\bturbopack\\b',
    '\\bswc\\b',                             // [CONTEXT] — acronym; "swc compiler" clearer
    '\\bswc compiler\\b',
    '\\bgrunt\\b',                           // [CAREFUL] — also a sound; "grunt.js" safer
    'grunt\\.js',
    '\\bgulp\\b',                            // [CAREFUL] — also a verb; "gulp.js" safer
    'gulp\\.js',
    '\\blerna\\b',
    '\\bturborepo\\b',
    '\\bnx\\b',                              // [CONTEXT] — "nx monorepo" or "nx workspace" preferred

    // ─── Testing (Frontend) ───
    '\\bjest\\b',
    '\\bvitest\\b',
    '\\bcypress\\b',
    '\\bplaywright\\b',
    '\\bselenium\\b',
    '\\bpuppeteer\\b',
    '\\btesting library\\b',
    '\\brtl\\b',                             // [CONTEXT] — React Testing Library acronym

    // ─── Web Standards & Best Practices ───
    'responsive design', '\\bresponsive web\\b',
    'web accessibility', '\\bwcag\\b',
    '\\baria\\b',                            // [CONTEXT] — also a name/music; "aria attributes" safer
    '\\baria attributes\\b',
    '\\bseo\\b',
    '\\bpwa\\b', 'progressive web app',
    '\\bweb vitals\\b', 'core web vitals',
    '\\bservice worker\\b',
    '\\bwebsocket\\b', 'web socket',
    '\\bwebrtc\\b',
    '\\bclient.side rendering\\b', '\\bcsr\\b',
    '\\bserver.side rendering\\b', '\\bssr\\b',
    '\\bstatic site generation\\b', '\\bssg\\b',
    '\\bisomorphic\\b',
    '\\bhydration\\b',                       // [CONTEXT] — also health/chemistry; frontend context needed
    '\\bcode splitting\\b',
    '\\blazy loading\\b',
    '\\btree shaking\\b',
    '\\bbrowser api\\b',
    '\\bdom\\b',                             // [SAFE] — Document Object Model
    '\\bvirtual dom\\b',
    '\\bshadow dom\\b',
    '\\bweb components\\b',
    '\\bcustom elements\\b',

    // ─── Graphics & Visualization ───
    '\\bthree\\.js\\b', '\\bthreejs\\b',
    '\\bd3\\.js\\b', '\\bd3js\\b', '\\bd3 visualization\\b',
    '\\bcanvas api\\b',
    '\\bwebgl\\b',
    '\\bwebgpu\\b',
    '\\bpixi\\.js\\b',
    '\\bchartjs\\b', 'chart\\.js',
    '\\becharts\\b',
    '\\brecharts\\b',
    '\\bhighcharts\\b',

    // ============================================================
    // ⚙️ BACKEND — COMPREHENSIVE SUPERSET
    // ============================================================

    // ─── Node.js Ecosystem ───
    'node\\.js', '\\bnodejs\\b',
    '\\bexpress\\b', 'express\\.js',
    '\\bfastify\\b',
    '\\bnestjs\\b', 'nest\\.js',
    '\\bhapi\\b',                            // [CONTEXT] — "hapi.js" or "hapi framework" safer
    'hapi\\.js',
    '\\bkoa\\b',                             // [CONTEXT] — also a plant; "koa.js" safer
    'koa\\.js',
    '\\badonis\\b',                          // [CAREFUL] — also a name; "adonisjs" safer
    '\\badonisjs\\b',
    '\\bfeathersjs\\b',
    '\\bstrapi\\b',
    '\\bsanity\\b',                          // [CAREFUL] — common word; "sanity cms" or "sanity.io" safer
    '\\bsanity cms\\b',
    '\\bpayload cms\\b',

    // ─── Python Backend ───
    '\\bdjango\\b', '\\bdjango rest framework\\b', '\\bdrf\\b',
    '\\bflask\\b',
    '\\bfastapi\\b',
    '\\baiohttp\\b',
    '\\btornado\\b',                         // [CAREFUL] — also weather; tech context helps
    '\\bcelery\\b',                          // [CAREFUL] — also a vegetable; "celery task queue" safer
    '\\bcelery task queue\\b',
    '\\bsqlalchemy\\b',
    '\\bpydantic\\b',
    '\\buvicorn\\b',
    '\\bgunicorn\\b',
    '\\bstarlette\\b',

    // ─── Java / JVM Backend ───
    'spring boot', '\\bspring framework\\b',
    '\\bspring\\b',                          // [CAREFUL] — also a season; tech context recommended
    '\\bspring mvc\\b',
    '\\bspring security\\b',
    '\\bspring data\\b',
    '\\bquarkus\\b',
    '\\bmicronaut\\b',
    '\\bjakarta ee\\b', '\\bjava ee\\b', '\\bj2ee\\b',
    '\\bhibernate\\b',                       // [SAFE] — ORM
    '\\bjpa\\b',                             // [CONTEXT] — "java persistence api" or "jpa hibernate" safer
    '\\bjava persistence\\b',
    '\\bmaven\\b',
    '\\bgradle\\b',
    '\\bvertx\\b', '\\bvert\\.x\\b',

    // ─── PHP Backend ───
    '\\blaravel\\b',
    '\\bsymfony\\b',
    '\\bcodeigniter\\b',
    '\\byii\\b',                             // [SAFE]
    '\\bzend\\b',                            // [SAFE]
    '\\bwordpress\\b',
    '\\bdrupal\\b',
    '\\bmagento\\b',
    '\\bcomposer\\b',                        // [CAREFUL] — also a musician; "composer php" safer

    // ─── Ruby Backend ───
    'ruby on rails', '\\brails\\b',
    '\\bsinatra\\b',                         // [CAREFUL] — also a name; "sinatra ruby" safer
    '\\bsinatra framework\\b',
    '\\bhanami\\b',

    // ─── Go Backend ───
    '\\bgin\\b',                             // [CONTEXT] — also a drink; "gin framework" or "gin golang" safer
    '\\bgin framework\\b',
    '\\becho framework\\b',
    '\\bfiber\\b',                           // [CONTEXT] — common word; "fiber go" or "gofiber" safer
    '\\bgofiber\\b',
    '\\bbeego\\b',
    '\\bgo chi\\b', '\\bchi router\\b',

    // ─── Rust Backend ───
    '\\bactix\\b', '\\bactix web\\b',
    '\\baxum\\b',
    '\\brocket\\b',                          // [CONTEXT] — also a vehicle; "rocket.rs" or "rocket framework" safer
    'rocket\\.rs',
    '\\bwarp\\b',                            // [CONTEXT] — common word; "warp server" or context helps

    // ─── .NET Backend ───
    '\\basp\\.net\\b', '\\baspnet\\b',
    '\\.net core', '\\bdotnet\\b',
    '\\bblazor\\b',
    '\\bsignalr\\b',
    '\\bentity framework\\b', '\\bef core\\b',
    '\\bdapper\\b',                          // [CAREFUL] — also an adjective; "dapper orm" safer
    '\\bdapper orm\\b',
    '\\bminimal api\\b',

    // ─── API Design & Protocols ───
    'rest api', 'restful api', '\\brestful\\b',
    '\\bgraphql\\b',
    '\\bgrpc\\b',
    '\\bwebsocket\\b',
    '\\bwebhook\\b',
    '\\bopenapi\\b', '\\bswagger\\b',
    '\\bapi gateway\\b',
    '\\bapi design\\b',
    '\\bjson.rpc\\b',
    '\\bsoap\\b',                            // [CONTEXT] — also cleaning product; "soap api" or "soap web service" safer
    '\\bsoap api\\b',
    '\\bsoap web service\\b',
    '\\bmessage queue\\b',
    '\\bevent.driven\\b', 'event driven architecture',
    '\\bcqrs\\b',
    '\\bevent sourcing\\b',

    // ─── Architecture Patterns ───
    'microservices', 'microservice architecture',
    '\\bmonolith\\b', '\\bmonolithic\\b',
    '\\bserverless\\b',
    '\\bedge computing\\b',
    '\\bbff\\b',                             // [CONTEXT] — Backend for Frontend pattern; slang overlap
    '\\bbackend for frontend\\b',
    '\\bsidecar\\b',                         // [CONTEXT] — also vehicle attachment; "sidecar pattern" safer
    '\\bsidecar pattern\\b',
    '\\bstrangler fig\\b',
    '\\bdomain driven design\\b', '\\bddd\\b',
    '\\bclean architecture\\b',
    '\\bhexagonal architecture\\b',
    '\\bonion architecture\\b',

    // ─── Auth & Security ───
    '\\bjwt\\b', 'json web token',
    '\\boauth\\b', '\\boauth2\\b', '\\boauth 2\\.0\\b',
    '\\boidc\\b', 'openid connect',
    '\\bsaml\\b',
    '\\bsso\\b', 'single sign.on',
    '\\bpassport\\.js\\b', '\\bpassportjs\\b',
    '\\bkeycloak\\b',
    '\\bauth0\\b',
    '\\bcognito\\b',                         // [CONTEXT] — "aws cognito" or "cognito auth" safer
    '\\baws cognito\\b',
    '\\bfirebase auth\\b',
    '\\bauthentication\\b',
    '\\bauthorization\\b',
    '\\brbac\\b', 'role.based access control',
    '\\babac\\b', 'attribute.based access control',
    '\\bmfa\\b', 'multi.factor authentication',
    '\\btotp\\b',
    '\\bcors\\b',
    '\\bcsrf\\b',
    '\\bxss\\b',                             // [SAFE] — cross-site scripting
    '\\bcontent security policy\\b', '\\bcsp\\b',
    '\\bssl\\b', '\\btls\\b',
    '\\bhttps\\b',
    '\\bcertificate\\b',                     // [CONTEXT] — very broad; use with caution, only in tech section
    '\\bencryption\\b',
    '\\bhashing\\b',
    '\\bbcrypt\\b',
    '\\bargon2\\b',
    '\\brate limiting\\b',
    '\\bddos protection\\b',
    '\\binput validation\\b',
    '\\bsanitization\\b',

    // ============================================================
    // 📱 MOBILE — COMPREHENSIVE SUPERSET
    // ============================================================

    // ─── Cross-Platform Frameworks ───
    '\\breact native\\b',
    '\\bflutter\\b',
    '\\bxamarin\\b',
    '\\bmaui\\b',                              // [CONTEXT] — also Hawaiian island; ".net maui" safer
    '\\.net maui\\b',
    '\\bionic\\b',                             // [CAREFUL] — also a brand; "ionic framework" safer
    '\\bionic framework\\b',
    '\\bcordova\\b',                           // [SAFE]
    '\\bphonegap\\b',                          // [SAFE]
    '\\bcapacitor\\b',                         // [CAREFUL] — also electronics component; tech context helps
    '\\bcapacitor framework\\b',
    '\\bnativescript\\b',                      // [SAFE]
    '\\bkotlin multiplatform\\b', '\\bkmp\\b', // [CONTEXT] — KMP acronym has overlap
    '\\bkmm\\b',                               // Kotlin Multiplatform Mobile
    '\\bcompose multiplatform\\b',

    // ─── Android Native ───
    '\\bandroid\\b',
    '\\bandroid sdk\\b',
    '\\bandroid studio\\b',
    '\\bjetpack compose\\b', '\\bcompose\\b',  // [CONTEXT] — "compose" alone is broad
    '\\bandroid jetpack\\b',
    '\\bjetpack\\b',                           // [CONTEXT] — also a product; "android jetpack" clearer
    '\\bviewmodel\\b',                         // [CONTEXT] — "android viewmodel" or "jetpack viewmodel"
    '\\broom database\\b', '\\broom db\\b',
    '\\breadroom\\b',                          // [CONTEXT] — also a noun; Android context needed
    '\\bworkmanager\\b',
    '\\bhilt\\b',                              // [CONTEXT] — also sword handle; "hilt android" or "hilt di" safer
    '\\bhilt android\\b',
    '\\bdagger\\b',                            // [CAREFUL] — also a weapon; "dagger android" or "dagger di" safer
    '\\bdagger android\\b', '\\bdagger hilt\\b',
    '\\bkoin\\b',                              // [SAFE] — DI framework
    '\\bnavigation component\\b',
    '\\bdata binding\\b',
    '\\bview binding\\b',
    '\\brecyclerview\\b',
    '\\bfragment\\b',                          // [CONTEXT] — very common word; Android context needed
    '\\bandroid fragment\\b',
    '\\bactivity lifecycle\\b',
    '\\bbroadcast receiver\\b',
    '\\bcontent provider\\b',
    '\\bandroid service\\b',
    '\\bintent\\b',                            // [CONTEXT] — common word; "android intent" safer
    '\\bandroid intent\\b',
    '\\bgradle\\b',
    '\\bproguard\\b',
    '\\br8 compiler\\b',
    '\\badb\\b',                               // [CONTEXT] — Android Debug Bridge; "adb android" safer
    '\\badb android\\b',
    '\\bmaterial design\\b',
    '\\bmaterial you\\b',                      // Android 12+ design language
    '\\bandroid material\\b',
    '\\bexoplayer\\b',
    '\\bglide\\b',                             // [CONTEXT] — common word; "glide android" safer
    '\\bglide android\\b',
    '\\bpicasso\\b',                           // [CAREFUL] — also a painter; "picasso android" safer
    '\\bpicasso android\\b',
    '\\bcoil\\b',                              // [CONTEXT] — also electronics; "coil android" or "coil image" safer
    '\\bcoil image\\b',
    '\\bretrofit\\b',                          // [SAFE] — HTTP client for Android
    '\\bokhttp\\b',                            // [SAFE]
    '\\bmoshi\\b',                             // [SAFE] — JSON library
    '\\bgson\\b',                              // [SAFE]
    '\\bkotlinx serialization\\b',
    '\\bcoroutines\\b',                        // [CONTEXT] — "kotlin coroutines" or "android coroutines" clearer
    '\\bkotlin coroutines\\b',
    '\\bkotlin flow\\b', '\\bstateflow\\b', '\\bsharedflow\\b',
    '\\blivedData\\b',
    '\\bpaging\\b',                            // [CONTEXT] — "android paging" or "paging library" clearer
    '\\bandroid paging\\b',

    // ─── iOS Native ───
    '\\bios\\b',
    '\\bswift\\b',                             // [CAREFUL] — also an adjective; tech context recommended
    '\\bswiftui\\b',                           // [SAFE]
    '\\buikit\\b',                             // [SAFE]
    '\\bobjective.c\\b', '\\bobjective-c\\b',
    '\\bxcode\\b',                             // [SAFE]
    '\\bcocoa\\b',                             // [CAREFUL] — also chocolate; "cocoa framework" or "cocoa touch" safer
    '\\bcocoa touch\\b',
    '\\bcocoapods\\b',                         // [SAFE]
    '\\bspm\\b',                               // [CONTEXT] — Swift Package Manager; "swift package manager" clearer
    '\\bswift package manager\\b',
    '\\bcarthagehub\\b',
    '\\bcarthage\\b',                          // [CAREFUL] — also an ancient city; "carthage ios" safer
    '\\bcarthage ios\\b',
    '\\bcombine framework\\b',
    '\\bswift combine\\b',
    '\\basync await swift\\b',
    '\\bswift concurrency\\b',
    '\\bcoredata\\b', '\\bcore data\\b',
    '\\bswiftdata\\b',
    '\\bcoreml\\b', '\\bcore ml\\b',
    '\\bcreateiml\\b',
    '\\bcreate ml\\b',
    '\\bvision framework\\b',                  // Apple Vision
    '\\barkit\\b',                             // [SAFE]
    '\\bscenekit\\b',                          // [SAFE]
    '\\brealitykit\\b',                        // [SAFE]
    '\\bcorelocation\\b', '\\bcore location\\b',
    '\\bmapkit\\b',                            // [SAFE]
    '\\bavfoundation\\b',                      // [SAFE]
    '\\bcloudkit\\b',                          // [SAFE]
    '\\bwidgetkit\\b',                         // [SAFE]
    '\\bwatchkit\\b',                          // [SAFE]
    '\\btvos\\b',                              // [SAFE]
    '\\bwatchos\\b',                           // [SAFE]
    '\\bmacos\\b',                             // [SAFE]
    '\\bvisionos\\b',                          // [SAFE] — Apple Vision Pro OS
    '\\buiviewcontroller\\b',
    '\\bauto layout\\b',
    '\\bstoryboard\\b',                        // [CAREFUL] — also UX/design term; fine to keep
    '\\btestflight\\b',                        // [SAFE]
    '\\bapp store connect\\b',
    '\\bins app purchase\\b', '\\biap\\b',     // [CONTEXT] — In-App Purchase
    '\\bapple pay\\b',
    '\\bpush notification\\b',
    '\\baapns\\b',                             // Apple Push Notification Service
    '\\bapns\\b',
    '\\bdeep link\\b', '\\buniversal link\\b',
    '\\bkeychain\\b',                          // [SAFE] — iOS secure storage
    '\\btouchid\\b', '\\bfaceid\\b',
    '\\bbiometric\\b',

    // ─── Mobile-Specific Tooling & CI/CD ───
    '\\bfastlane\\b',                          // [SAFE] — mobile CI/CD automation
    '\\bbitrise\\b',                           // [SAFE]
    '\\bappcenter\\b', '\\bapp center\\b',     // Microsoft App Center
    '\\bfirebase\\b',                          // [SAFE] — heavily used in mobile
    '\\bfirebase crashlytics\\b',
    '\\bfirebase fcm\\b',
    '\\bfirebase analytics\\b',
    '\\bfirebase remote config\\b',
    '\\bgoogle play\\b',                       // [SAFE]
    '\\bplay store\\b',
    '\\bapp store\\b',
    '\\bapp signing\\b',
    '\\bprovisioning profile\\b',
    '\\bcode signing\\b',
    '\\bipa\\b',                               // [CONTEXT] — iOS app binary; "ipa file" or "ipa build" safer
    '\\bipa file\\b',
    '\\bapk\\b',                               // [SAFE] — Android Package
    '\\baab\\b',                               // [CONTEXT] — Android App Bundle; "aab android" safer
    '\\baab android\\b',
    '\\bapp bundle\\b',
    '\\bplay console\\b',

    // ─── State Management (Mobile) ───
    '\\bprovider\\b',                          // [CONTEXT] — Flutter state; very common word; "flutter provider" safer
    '\\bflutter provider\\b',
    '\\briverpod\\b',                          // [SAFE] — Flutter state management
    '\\bbloc\\b',                              // [CONTEXT] — Flutter BLoC pattern; common acronym
    '\\bflutter bloc\\b',
    '\\bcubit\\b',                             // [SAFE] — Flutter BLoC variant
    '\\bgetx\\b',                              // [SAFE] — Flutter framework
    '\\bmobx flutter\\b',

    // ─── Mobile Testing ───
    '\\bespresso\\b',                          // [CAREFUL] — also coffee; "espresso android" or "espresso testing" safer
    '\\bespresso testing\\b',
    '\\bui automator\\b',
    '\\bxctest\\b',                            // [SAFE]
    '\\bxcuitest\\b',                          // [SAFE]
    '\\bdetox\\b',                             // [CAREFUL] — also health term; "detox testing" or "detox react native" safer
    '\\bdetox testing\\b',
    '\\bappium\\b',                            // [SAFE]
    '\\bmockito\\b',                           // [SAFE]
    '\\brobolectric\\b',                       // [SAFE]

    // ─── Mobile Performance & Optimization ───
    '\\bapp performance\\b',
    '\\bframe rate\\b', '\\bfps\\b',           // [CONTEXT] — "app fps" or mobile context
    '\\bjank\\b',                              // [CONTEXT] — mobile rendering stutter term
    '\\bbattery optimization\\b',
    '\\bmemory leak\\b',
    '\\bprofile mode\\b',                      // Flutter profiling
    '\\brelease mode\\b',
    '\\bbundle size\\b',
    '\\bcode shrinking\\b',
    '\\bapp startup time\\b',
    '\\bbackground processing\\b',
    '\\bpush notification\\b',
    '\\boffline.first\\b', 'offline first',
    '\\blocal storage\\b',
    '\\bsecure storage\\b',
    '\\bsqlite\\b',

    // ─── Mobile UX / Platform Concepts ───
    '\\bresponsive layout\\b',
    '\\badaptive layout\\b',
    '\\bsafe area\\b',                         // iOS notch handling
    '\\bkeyboard avoidance\\b',
    '\\bgesture handling\\b',
    '\\bhaptic feedback\\b',
    '\\bdark mode\\b',
    '\\bdynamic type\\b',                      // iOS accessibility font scaling
    '\\baccessibility ios\\b',
    '\\btalkback\\b',                          // Android screen reader
    '\\bvoiceover\\b',                         // [CAREFUL] — also a narration term; "voiceover ios" safer
    '\\bvoiceover ios\\b',
    '\\bmobile accessibility\\b',
    '\\bmobile deep link\\b',

    // ============================================================
    // 🤖 AI / MACHINE LEARNING CORE
    // ============================================================

    // ─── Deep Learning Frameworks ───
    '\\bpytorch\\b', '\\btorch\\b',
    '\\bpytorch lightning\\b',
    '\\bfastai\\b',
    '\\btensorflow\\b', '\\btf\\b',             // [CONTEXT] — "tf" alone risky; use with ML context
    '\\btensorflow lite\\b', '\\btflite\\b',
    '\\btensorflow.js\\b', '\\btfjs\\b',
    '\\bkeras\\b',
    '\\bjax\\b',                                // [CONTEXT] — also a city; "jax ml" or "google jax" safer
    '\\bgoogle jax\\b',
    '\\bflax\\b',                               // [CONTEXT] — also a plant; "flax neural" or "flax jax" safer
    '\\bflax jax\\b',
    '\\bhaiku\\b',                              // [CONTEXT] — also a poem; "haiku deepmind" safer
    '\\bhaiku deepmind\\b',
    '\\boptax\\b',                              // [SAFE] — JAX optimizer library
    '\\btheano\\b',                             // [SAFE] — legacy but still on resumes
    '\\bcaffe\\b',                              // [CAREFUL] — also coffee shop; "caffe deep learning" safer
    '\\bcaffe2\\b',
    '\\bpaddlepaddle\\b',                       // [SAFE]
    '\\bmxnet\\b',                              // [SAFE]
    '\\bcntk\\b',                               // [SAFE] — Microsoft Cognitive Toolkit
    '\\bonnx\\b',                               // [SAFE] — Open Neural Network Exchange
    '\\bonnx runtime\\b',
    '\\btensorrt\\b',                           // [SAFE] — NVIDIA inference optimizer
    '\\bopenvino\\b',                           // [SAFE] — Intel inference toolkit

    // ─── Classical ML ───
    'scikit[- ]learn', '\\bsklearn\\b',
    '\\bxgboost\\b',
    '\\blightgbm\\b',
    '\\bcatboost\\b',
    '\\badaboost\\b',
    '\\brandom forest\\b',
    '\\bgradient boosting\\b',
    '\\bsvм\\b', '\\bsupport vector machine\\b',
    '\\bknn\\b', '\\bk.nearest neighbor\\b',
    '\\bnaive bayes\\b',
    '\\blogistic regression\\b',
    '\\blinear regression\\b',
    '\\bdecision tree\\b',
    '\\bensemble method\\b',
    '\\bboosting\\b',                           // [CONTEXT] — ML context needed
    '\\bbagging\\b',                            // [CONTEXT] — also packaging; ML context needed
    '\\bcross.validation\\b', 'cross validation',
    '\\bhyperparameter tuning\\b',
    '\\bgrid search\\b',
    '\\brandom search\\b',
    '\\boptuna\\b',                             // [SAFE] — hyperparameter optimization
    '\\bhyperopt\\b',                           // [SAFE]
    '\\bray tune\\b',
    '\\bimbalanced.learn\\b',

    // ─── LLM / Generative AI ───
    '\\bllm\\b',                                // [CONTEXT] — "llm training" or "large language model" clearer
    '\\blarge language model\\b',
    '\\bgpt\\b',                                // [CONTEXT] — also other meanings; AI context recommended
    '\\bchatgpt\\b',
    '\\bgpt.4\\b', '\\bgpt.3\\b', '\\bgpt4\\b', '\\bgpt3\\b',
    '\\bclaude\\b',                             // [CAREFUL] — also a name; "claude ai" or "anthropic claude" safer
    '\\bclaude ai\\b',
    '\\bgemini\\b',                             // [CAREFUL] — also zodiac/Google product; "gemini ai" or "google gemini" safer
    '\\bgemini ai\\b',
    '\\bllama\\b',                              // [CAREFUL] — also an animal; "llama model" or "meta llama" safer
    '\\bmeta llama\\b', '\\bllama model\\b',
    '\\bmistral\\b',                            // [CONTEXT] — also a wind; "mistral ai" or "mistral model" safer
    '\\bmistral ai\\b',
    '\\bfalcon\\b',                             // [CONTEXT] — also a bird/car; "falcon llm" safer
    '\\bfalcon llm\\b',
    '\\boldllama\\b', '\\bollama\\b',           // local LLM runner
    '\\bvllm\\b',                               // [SAFE] — high-throughput LLM serving
    '\\btext generation\\b',
    '\\bprompt engineering\\b',
    '\\bprompt tuning\\b',
    '\\bfew.shot\\b', 'few shot learning',
    '\\bzero.shot\\b', 'zero shot learning',
    '\\bchain of thought\\b', '\\bcot\\b',
    '\\bretrieval augmented generation\\b', '\\brag\\b',
    '\\brag pipeline\\b',
    '\\bembedding\\b',                          // [CONTEXT] — "text embedding" or "vector embedding" clearer
    '\\btext embedding\\b', '\\bvector embedding\\b',
    '\\bfine.tuning\\b', 'fine tuning llm',
    '\\blora\\b',                               // [CONTEXT] — also a name; "lora fine tuning" or "lora adapter" safer
    '\\blora fine.tuning\\b', '\\bqlora\\b',
    '\\binstruction tuning\\b',
    '\\breinforcement learning from human feedback\\b', '\\brlhf\\b',
    '\\bdpo\\b',                                // Direct Preference Optimization
    '\\bppo\\b',                                // [CONTEXT] — also finance; "ppo reinforcement learning" safer
    '\\btokenization\\b',
    '\\btransformer\\b',                        // [CONTEXT] — also electronics; ML context needed
    '\\btransformer architecture\\b',
    '\\battention mechanism\\b',
    '\\bself.attention\\b',
    '\\bmulti.head attention\\b',
    '\\bbert\\b',                               // [CONTEXT] — also a name; "bert model" or "bert nlp" safer
    '\\bgpt.2\\b',
    '\\bt5\\b',                                 // [CONTEXT] — "t5 model" or "google t5" safer
    '\\bbart\\b',                               // [CONTEXT] — also a name; "bart model" or "facebook bart" safer
    '\\broberta\\b',
    '\\bxlnet\\b',
    '\\belectra\\b',                            // [CONTEXT] — also a name; "electra model" safer
    '\\bclip\\b',                               // [CONTEXT] — also common verb; "clip model" or "openai clip" safer
    '\\bopenai clip\\b',
    '\\bwhisper\\b',                            // [CONTEXT] — also a verb; "whisper asr" or "openai whisper" safer
    '\\bwhisper asr\\b', '\\bopenai whisper\\b',
    '\\bdall.e\\b', '\\bdalle\\b',
    '\\bstable diffusion\\b',
    '\\bmidjourney\\b',
    '\\bimage generation\\b',
    '\\btext to image\\b',
    '\\bmultimodal\\b',
    '\\bvision language model\\b', '\\bvlm\\b',

    // ─── LLM Orchestration & Tooling ───
    '\\blangchain\\b',
    '\\bllamaindex\\b', 'llama[- ]index',
    '\\blangraph\\b',
    '\\bautogen\\b',                            // [CONTEXT] — "autogen microsoft" or "autogen agent" safer
    '\\bcrewai\\b',
    '\\bsemantic kernel\\b',
    '\\bhaystack\\b',                           // [CONTEXT] — also a farm object; "haystack nlp" or "deepset haystack" safer
    '\\bhaystack nlp\\b',
    '\\bflowise\\b',
    '\\bdspy\\b',                               // [SAFE] — Stanford DSPy framework
    '\\bphidata\\b',
    '\\bagno\\b',
    '\\baisuite\\b',
    '\\bopenai sdk\\b', '\\bopenai api\\b',
    '\\banthropic sdk\\b',
    '\\bai agent\\b', '\\bai agents\\b',
    '\\bagentic\\b',
    '\\btool calling\\b', '\\bfunction calling\\b',
    '\\bmcp\\b',                                // [CONTEXT] — Model Context Protocol; "mcp protocol" safer
    '\\bmodel context protocol\\b',
    '\\bvector store\\b', '\\bvector database\\b',
    '\\bchroma\\b',                             // [CONTEXT] — also color; "chroma db" or "chromadb" safer
    '\\bchromadb\\b',
    '\\bpinecone\\b',                           // [SAFE]
    '\\bweaviate\\b',                           // [SAFE]
    '\\bqdrant\\b',                             // [SAFE]
    '\\bmilvus\\b',                             // [SAFE]
    '\\bfaiss\\b',                              // [SAFE] — Meta vector search
    '\\bannoy\\b',                              // [CONTEXT] — "annoy index" or "spotify annoy" safer
    '\\bannoy index\\b',

    // ─── Hugging Face Ecosystem ───
    'hugging ?face',
    '\\btransformers\\b',                       // [CONTEXT] — "huggingface transformers" or ML context
    '\\bhf hub\\b', '\\bhuggingface hub\\b',
    '\\bdatasets\\b',                           // [CONTEXT] — "huggingface datasets" or "hf datasets" clearer
    '\\bhf datasets\\b',
    '\\bpeft\\b',                               // [SAFE] — Parameter Efficient Fine-Tuning
    '\\btrl\\b',                                // [CONTEXT] — Transformer Reinforcement Learning; ML context
    '\\bdiffusers\\b',                          // [SAFE] — HF diffusion models library
    '\\boptimum\\b',                            // [CONTEXT] — "huggingface optimum" clearer
    '\\bhuggingface optimum\\b',
    '\\bsentence transformers\\b',
    '\\bsetfit\\b',

    // ─── NLP / CV / Audio ───
    '\\bnlp\\b',                                // [CONTEXT] — "nlp pipeline" or "natural language processing"
    '\\bnatural language processing\\b',
    '\\bnatural language understanding\\b', '\\bnlu\\b',
    '\\bnatural language generation\\b', '\\bnlg\\b',
    '\\bnamed entity recognition\\b', '\\bner\\b',
    '\\btext classification\\b',
    '\\bsentiment analysis\\b',
    '\\btext summarization\\b',
    '\\bmachine translation\\b',
    '\\bquestion answering\\b',
    '\\binformation extraction\\b',
    '\\bspacy\\b',
    '\\bnltk\\b',
    '\\bgensim\\b',
    '\\bword2vec\\b',
    '\\bglove\\b',                              // [CONTEXT] — also sportswear; "glove embeddings" or "glove nlp" safer
    '\\bglove embeddings\\b',
    '\\bfasttext\\b',
    '\\bcomputer vision\\b',
    '\\bopencv\\b',
    '\\bimage classification\\b',
    '\\bobject detection\\b',
    '\\byolo\\b',                               // [CONTEXT] — also internet slang; "yolo model" or "yolov8" safer
    '\\byolov\\d\\b',
    '\\bimage segmentation\\b',
    '\\binstance segmentation\\b',
    '\\bpose estimation\\b',
    '\\bocr\\b',                                // [SAFE] — Optical Character Recognition
    '\\btesseract\\b',                          // [SAFE] — OCR engine
    '\\bpillow\\b',                             // [CONTEXT] — also household item; "pillow python" or PIL safer
    '\\bpil\\b',                                // Python Imaging Library
    '\\bspeech recognition\\b',
    '\\basr\\b',                                // Automatic Speech Recognition
    '\\btext to speech\\b', '\\btts\\b',
    '\\bspeech synthesis\\b',
    '\\bpyaudio\\b',
    '\\blibrosa\\b',

    // ─── MLOps / Model Lifecycle ───
    '\\bmlops\\b',
    '\\bmlflow\\b',
    '\\bwandb\\b', '\\bweights and biases\\b',
    '\\bneptune\\b',                            // [CONTEXT] — also a planet; "neptune ml" or "neptune.ai" safer
    '\\bneptune\\.ai\\b',
    '\\bcomet ml\\b', '\\bcometml\\b',
    '\\bdvc\\b',                                // [CONTEXT] — Data Version Control; "dvc mlops" safer
    '\\bdata version control\\b',
    '\\bclearml\\b',
    '\\bbentoml\\b',
    '\\bseldon\\b',                             // [SAFE] — model serving
    '\\btorchserve\\b',
    '\\btriton\\b',                             // [CONTEXT] — also Neptune's moon; "triton inference" or "nvidia triton" safer
    '\\bnvidia triton\\b', '\\btriton inference\\b',
    '\\bkubeflow\\b',
    '\\bvertex ai\\b',
    '\\bsagemaker\\b',                          // [SAFE]
    '\\bazure ml\\b', '\\bazure machine learning\\b',
    '\\bmodel registry\\b',
    '\\bmodel serving\\b',
    '\\bmodel deployment\\b',
    '\\bmodel monitoring\\b',
    '\\bdata drift\\b', '\\bmodel drift\\b',
    '\\bfeature store\\b',
    '\\bfeast\\b',                              // [CONTEXT] — also food; "feast feature store" safer
    '\\bhopsworks\\b',
    '\\btecton\\b',
    '\\bab testing ml\\b',
    '\\bshadow deployment\\b',
    '\\bcanary deployment\\b',

    // ─── Scientific Python Stack ───
    '\\bnumpy\\b',
    '\\bpandas\\b',
    '\\bscipy\\b',
    '\\bmatplotlib\\b',
    '\\bseaborn\\b',
    '\\bplotly\\b',
    '\\bbokeh\\b',                              // [CONTEXT] — also a photography term; tech context helps
    '\\baltair\\b',                             // [CAREFUL] — also a star/brand; "altair python" safer
    '\\baltair python\\b',
    '\\bnumba\\b',                              // [SAFE]
    '\\bcupy\\b',                               // [SAFE] — GPU NumPy
    '\\bdask\\b',                               // [SAFE] — parallel computing
    '\\bray\\b',                                // [CONTEXT] — also a name; "ray framework" or "ray distributed" safer
    '\\bray distributed\\b',
    '\\bmodin\\b',                              // [SAFE] — distributed pandas
    '\\bpolars\\b',                             // [SAFE] — fast dataframes
    '\\bvaex\\b',                               // [SAFE]
    '\\bpyarrow\\b',                            // [SAFE]

    // ─── Reinforcement Learning ───
    '\\breinforcement learning\\b', '\\brl\\b',
    '\\bdeep reinforcement learning\\b', '\\bdrl\\b',
    '\\bq.learning\\b', 'q learning',
    '\\bdeep q.network\\b', '\\bdqn\\b',
    '\\bpolicy gradient\\b',
    '\\bactor.critic\\b', 'actor critic',
    '\\bppo\\b',                                // Proximal Policy Optimization
    '\\bsac\\b',                                // Soft Actor-Critic
    '\\bgym\\b',                                // [CONTEXT] — also exercise; "openai gym" or "gymnasium rl" safer
    '\\bopenai gym\\b', '\\bgymnasium\\b',
    '\\bstable baselines\\b',
    '\\brllib\\b',

    // ============================================================
    // 📊 DATA ANALYTICS — COMPREHENSIVE SUPERSET
    // ============================================================

    // ─── Core Analytics Concepts ───
    'data analysis', 'data analytics',
    'data visualization', 'data viz',
    '\\beda\\b', 'exploratory data analysis',
    '\\bdescriptive analytics\\b',
    '\\bpredictive analytics\\b',
    '\\bprescriptive analytics\\b',
    '\\bdiagnostic analytics\\b',
    '\\bbusiness intelligence\\b', '\\bbi\\b',  // [CONTEXT] — "bi dashboard" or "business intelligence" clearer
    '\\bkpi\\b',                                // [CONTEXT] — "kpi dashboard" or "kpi reporting" clearer
    '\\bkpi dashboard\\b',
    '\\bdashboard\\b',                          // [CONTEXT] — "analytics dashboard" or tech context
    '\\breporting\\b',                          // [CONTEXT] — very broad; only in analytics section

    // ─── Statistics ───
    '\\bstatistics\\b', '\\bstatistical analysis\\b',
    '\\bhypothesis testing\\b',
    '\\bp.value\\b', 'p value',
    '\\bconfidence interval\\b',
    '\\bstatistical significance\\b',
    '\\bregression analysis\\b',
    '\\bcorrelation analysis\\b',
    '\\banova\\b',                              // [SAFE]
    '\\bchi.square\\b', 'chi square test',
    '\\bt.test\\b', 't test',
    '\\bbayesian\\b', 'bayesian statistics',
    '\\bmarkov\\b', 'markov chain',
    '\\bmonte carlo\\b',
    '\\bcentral limit theorem\\b',
    '\\bbootstrapping\\b',                      // [CONTEXT] — also web framework; "statistical bootstrapping" clearer
    '\\bprobability distribution\\b',
    '\\bnormal distribution\\b',
    '\\bpoisson distribution\\b',

    // ─── Experimentation ───
    'a\\/b testing', '\\bab testing\\b',
    '\\bexperiment design\\b',
    '\\bmultivariate testing\\b',
    '\\bsplit testing\\b',
    '\\bbandit algorithm\\b',
    '\\bcausal inference\\b',
    '\\bdifference in differences\\b',
    '\\brdd\\b',                                // Regression Discontinuity Design
    '\\bpropensity score\\b',
    '\\bcounterfactual\\b',

    // ─── Time Series & Forecasting ───
    'time series', 'time series analysis',
    '\\bforecasting\\b',
    '\\barima\\b',
    '\\bsarima\\b',
    '\\barimax\\b',
    '\\bexponential smoothing\\b',
    '\\bholts winter\\b',
    '\\bprophet\\b',                            // [CONTEXT] — also religious term; "facebook prophet" or "prophet forecasting" safer
    '\\bfacebook prophet\\b', '\\bmeta prophet\\b',
    '\\bneuralforecast\\b',
    '\\bstatsForecast\\b',
    '\\blstm forecasting\\b',
    '\\btemporal fusion transformer\\b', '\\btft\\b',
    '\\bseasonality\\b',
    '\\bstationarity\\b',
    '\\bautocorrelation\\b',

    // ─── BI & Visualization Tools ───
    '\\bpower bi\\b',
    '\\btableau\\b',
    '\\qlooker\\b',                             // [SAFE]
    '\\blooker studio\\b',
    '\\bgoogle data studio\\b',
    '\\bmetabase\\b',
    '\\bsuperset\\b',                           // [CONTEXT] — also a math concept; "apache superset" or "superset bi" safer
    '\\bapache superset\\b',
    '\\bplotly\\b',
    '\\bdash\\b',                               // [CONTEXT] — common word; "plotly dash" or "dash python" safer
    '\\bplotly dash\\b',
    '\\bstreamlit\\b',                          // [SAFE]
    '\\bgradio\\b',                             // [SAFE]
    '\\bpanel\\b',                              // [CONTEXT] — very common word; "panel python" or "holoviz panel" safer
    '\\bholoviz panel\\b',
    '\\bqlik\\b',                               // [SAFE]
    '\\bsisense\\b',
    '\\bmicrostrategy\\b',
    '\\bcognos\\b',
    '\\bsap businessobjects\\b',
    '\\bdomo\\b',                               // [CONTEXT] — also a brand name; "domo analytics" safer
    '\\bdomo analytics\\b',

    // ─── Feature Engineering ───
    'feature engineering',
    'feature selection',
    'feature extraction',
    'feature importance',
    '\\bdimensionality reduction\\b',
    '\\bpca\\b',                                // [CONTEXT] — "pca dimensionality" or "principal component analysis" clearer
    '\\bprincipal component analysis\\b',
    '\\btsne\\b', 't-sne',
    '\\bumap\\b',
    '\\boutlier detection\\b',
    '\\banomalydetection\\b', '\\banomaly detection\\b',
    '\\bdata imputation\\b',
    '\\bone.hot encoding\\b', 'one hot encoding',
    '\\blabel encoding\\b',
    '\\bscaling\\b',                            // [CONTEXT] — "feature scaling" or "data scaling" clearer
    '\\bfeature scaling\\b',
    '\\bnormalization\\b',
    '\\bstandardization\\b',

    // ============================================================
    // 🏗️ DATA ENGINEERING — COMPREHENSIVE SUPERSET
    // ============================================================

    // ─── ETL / ELT ───
    '\\betl\\b', '\\belt\\b',
    '\\bdata pipeline\\b', '\\bdata pipelines\\b',
    '\\bdata ingestion\\b',
    '\\bdata integration\\b',
    '\\bdata transformation\\b',
    '\\bdata wrangling\\b',
    '\\bdata cleaning\\b',
    '\\bdata quality\\b',
    '\\bdata validation\\b',
    '\\bdata lineage\\b',
    '\\bdata catalog\\b',
    '\\bdata governance\\b',
    '\\bdata mesh\\b',
    '\\bdata fabric\\b',
    '\\bdata contract\\b',
    '\\bdata observability\\b',
    '\\bschema evolution\\b',

    // ─── Batch Processing ───
    'batch processing',
    '\\bapache spark\\b', '\\bspark\\b',
    '\\bpyspark\\b',
    '\\bspark sql\\b',
    '\\bspark streaming\\b',
    '\\bdelta lake\\b',
    '\\bapache hadoop\\b', '\\bhadoop\\b',
    '\\bhdfs\\b',
    '\\bmapreduce\\b', 'map reduce',
    '\\bhive\\b',                               // [CONTEXT] — also a beehive; "apache hive" or "hive sql" safer
    '\\bapache hive\\b',
    '\\bapache pig\\b',
    '\\bapache flink\\b', '\\bflink\\b',
    '\\bapache beam\\b',
    '\\bdataproc\\b',                           // [SAFE] — Google Cloud Dataproc
    '\\bemr\\b',                                // [CONTEXT] — AWS EMR; "aws emr" or "amazon emr" safer
    '\\bamazon emr\\b',
    '\\bazure databricks\\b', '\\bdatabricks\\b',
    '\\bapache iceberg\\b', '\\biceberg\\b',    // [CONTEXT] — also frozen water; "iceberg table format" clearer
    '\\biceberg table\\b',
    '\\bapache hudi\\b', '\\bhudi\\b',
    '\\bapache parquet\\b', '\\bparquet\\b',
    '\\bavro\\b',                               // [CONTEXT] — also a brand; "avro format" or "apache avro" safer
    '\\bapache avro\\b',
    '\\borc\\b',                                // [CONTEXT] — also mythology; "orc format" or "apache orc" safer
    '\\borc format\\b',

    // ─── Stream Processing ───
    'stream processing', 'real.time processing',
    '\\bapache kafka\\b', '\\bkafka\\b',
    '\\bkafka streams\\b',
    '\\bksqldb\\b',
    '\\bapache flink\\b',
    '\\bapache pulsar\\b', '\\bpulsar\\b',      // [CONTEXT] — also astronomy; "apache pulsar" clearer
    '\\bkinesis\\b',                            // [CONTEXT] — "aws kinesis" or "kinesis streams" safer
    '\\baws kinesis\\b',
    '\\bpubsub\\b', '\\bgoogle pubsub\\b',
    '\\bevent hub\\b', '\\bazure event hub\\b',
    '\\bdebezium\\b',                           // [SAFE] — CDC tool
    '\\bcdc\\b',                                // [CONTEXT] — Change Data Capture; also US health agency
    '\\bchange data capture\\b',
    '\\bevent streaming\\b',
    '\\bmessage broker\\b',
    '\\brabbitmq\\b',

    // ─── Workflow Orchestration ───
    '\\bairflow\\b', '\\bapache airflow\\b',
    '\\bdag\\b',                                // [CONTEXT] — "airflow dag" or "directed acyclic graph" clearer
    '\\bdirected acyclic graph\\b',
    '\\bdbt\\b', '\\bdata build tool\\b',
    '\\bdbt cloud\\b', '\\bdbt core\\b',
    '\\bprefect\\b',                            // [SAFE]
    '\\bkeda\\b',                               // [CONTEXT] — also Turkish word; "keda orchestration" safer
    '\\bkubeflow pipelines\\b',
    '\\bargo\\b',                               // [CONTEXT] — also a brand; "argo workflows" or "argo cd" safer
    '\\bargo workflows\\b',
    '\\bdagster\\b',                            // [SAFE]
    '\\bmetaflow\\b',                           // [SAFE] — Netflix ML pipeline
    '\\bzenml\\b',
    '\\blake formation\\b', '\\baws lake formation\\b',
    '\\bgoogle dataflow\\b', '\\bdataflow\\b',  // [CONTEXT] — "google dataflow" or "apache beam dataflow" clearer
    '\\bazure data factory\\b', '\\badf\\b',    // [CONTEXT] — "azure data factory" or "adf pipeline" clearer

    // ─── Data Warehousing ───
    '\\bdata warehouse\\b', '\\bdwh\\b',
    '\\bdata lake\\b',
    '\\bdata lakehouse\\b',
    '\\bsnowflake\\b',                          // [CAREFUL] — also a weather term; tech context recommended
    '\\bbigquery\\b',                           // [SAFE]
    '\\bredshift\\b',                           // [CONTEXT] — also astronomy; "amazon redshift" or "redshift warehouse" safer
    '\\bamazon redshift\\b',
    '\\bsynapse analytics\\b', '\\bazure synapse\\b',
    '\\bfirebolt\\b',
    '\\bclickhouse\\b',
    '\\bduckdb\\b',
    '\\bstarburst\\b',                          // [CONTEXT] — also a candy; "starburst trino" or "starburst analytics" safer
    '\\btrino\\b',
    '\\bpresto\\b',                             // [CONTEXT] — also a word; "presto sql" or "prestodb" safer
    '\\bprestodb\\b',
    '\\bapache druid\\b', '\\bdruid\\b',        // [CONTEXT] — also a fantasy class; "apache druid" safer
    '\\bpinot\\b',                              // [CONTEXT] — also a wine; "apache pinot" or "pinot analytics" safer
    '\\bapache pinot\\b',
    '\\bteradata\\b',
    '\\bnetezza\\b',
    '\\bvertica\\b',
    '\\bsap hana\\b',
    '\\bstar schema\\b',
    '\\bsnowflake schema\\b',
    '\\bdimension table\\b',
    '\\bfact table\\b',
    '\\bolap\\b',                               // [CONTEXT] — "olap cube" or "olap analytics" clearer
    '\\boltp\\b',

    // ─── Database Technologies ───
    '\\bpostgresql\\b', '\\bpostgres\\b',
    '\\bmysql\\b',
    '\\bsqlite\\b',
    '\\bmongodb\\b',
    '\\belasticsearch\\b',
    '\\bopensearch\\b',
    '\\bcassandra\\b',                          // [CONTEXT] — also a name; "apache cassandra" or "cassandra db" safer
    '\\bapache cassandra\\b',
    '\\bhbase\\b',
    '\\bcouchdb\\b',
    '\\bcouchbase\\b',
    '\\bredis\\b',
    '\\bmemcached\\b',
    '\\bneo4j\\b',
    '\\barangodb\\b',
    '\\btimescaledb\\b',
    '\\binfluxdb\\b',                           // [SAFE] — time series database
    '\\bprometheus\\b',                         // [CONTEXT] — "prometheus monitoring" or metrics context

    // ─── Cloud Data Platforms ───
    '\\bgcp\\b', '\\bgoogle cloud platform\\b',
    '\\bbigquery\\b',
    '\\bcloud storage\\b',
    '\\bgoogle cloud storage\\b', '\\bgcs\\b',
    '\\baws s3\\b', '\\bamazon s3\\b',
    '\\bazure blob\\b',
    '\\bglue\\b',                               // [CONTEXT] — "aws glue" or "glue etl" safer
    '\\baws glue\\b',
    '\\blambda\\b',                             // [CONTEXT] — "aws lambda" or "lambda function" safer
    '\\baws lambda\\b',
    '\\bstep functions\\b', '\\baws step functions\\b',
    '\\beventbridge\\b', '\\baws eventbridge\\b',

    // =========================
    // ⚙️ DEVOPS
    // =========================
    '\\bdocker\\b', '\\bkubernetes\\b', '\\bk8s\\b',
    '\\bterraform\\b', '\\bansible\\b', '\\bhelm\\b',
    '\\bvagrant\\b', '\\bpacker\\b', '\\bpulumi\\b',

    'ci\\/cd', 'continuous integration', 'continuous deployment', 'continuous delivery',

    '\\bjenkins\\b', 'github actions', 'gitlab ci', 'circleci', 'travis ci',
    '\\bargocd\\b', '\\btekton\\b', '\\bspinnaker\\b', 'azure devops', 'bamboo',

    'prometheus', 'grafana', '\\bdatadog\\b', '\\bnewrelic\\b', 'new relic',
    '\\bsplunk\\b', '\\bjaeger\\b', '\\bzipkin\\b', 'opentelemetry',
    'elk stack', 'logstash', '\\bkibana\\b',

    '\\blinux\\b', '\\bunix\\b', 'shell scripting', '\\bbash\\b', '\\bzsh\\b',
    '\\bnginx\\b', '\\bapache\\b', '\\bhaproxy\\b',
    'service mesh', '\\bistio\\b', '\\benvoy\\b', '\\blinkerd\\b',

    // =========================
    // ☁️ CLOUD PLATFORMS
    // =========================
    '\\baws\\b', 'amazon web services',
    '\\bec2\\b', '\\bs3\\b', '\\blambda\\b', '\\brds\\b', '\\beks\\b',
    '\\becs\\b', '\\bcloudfront\\b', '\\bsqs\\b', '\\bsns\\b',
    '\\bapi gateway\\b', '\\bcloudwatch\\b', '\\biam\\b',

    '\\bgcp\\b', 'google cloud', 'google cloud platform',
    '\\bgke\\b', '\\bbigquery\\b', '\\bcloud run\\b', 'cloud functions',
    '\\bfirebase\\b', '\\bpub\\/sub\\b',

    '\\bazure\\b', 'microsoft azure',
    'azure functions', 'azure devops', '\\baks\\b', 'azure blob',
    'azure cosmos', 'azure active directory',

    '\\bdigitalocean\\b', '\\bheroku\\b', '\\bvercel\\b', '\\bnetlify\\b',
    '\\bcloudflare\\b', '\\blinode\\b', '\\bvultr\\b',

    'infrastructure as code', '\\biac\\b',
    'serverless', 'microservices', 'cloud native',

    // =========================
    // 🗄️ DATABASES
    // =========================

    // — Relational —
    '\\bsql\\b', '\\bmysql\\b', '\\bpostgresql\\b', '\\bpostgres\\b',
    '\\bsqlite\\b', '\\boracle\\b', '\\bmariadb\\b',
    'microsoft sql server', '\\bmssql\\b', '\\bdb2\\b',
    '\\bsupabase\\b', '\\bplanetscale\\b', '\\bneon\\b',

    // — NoSQL —
    '\\bmongodb\\b', '\\bredis\\b', '\\belasticsearch\\b',
    '\\bdynamodb\\b', '\\bcassandra\\b', '\\bcouchdb\\b',
    '\\bhbase\\b', '\\brethinkdb\\b', '\\bravendb\\b',
    '\\bfirestore\\b', '\\bfaunadb\\b', '\\bappwrite\\b',
    '\\bnosql\\b',

    // — Graph —
    'graph database', '\\bneo4j\\b', '\\barangodb\\b', '\\bdgraph\\b',

    // — Vector / AI —
    'vector database', '\\bpinecone\\b', '\\bweaviate\\b',
    '\\bqdrant\\b', '\\bmilvus\\b', '\\bchroma\\b', '\\bpgvector\\b',

    // — Time Series —
    'time series', '\\binfluxdb\\b', '\\btimescaledb\\b', '\\bprometheus\\b',

    // — Columnar / Analytics —
    '\\bclickhouse\\b', '\\bsnowflake\\b', '\\bbigquery\\b',
    '\\bredshift\\b', '\\bdatabricks\\b', '\\bduckdb\\b',

    // =========================
    // 🔐 SECURITY
    // =========================

    // — Core Concepts —
    'cybersecurity', 'information security', 'infosec',
    'application security', 'appsec', 'network security',
    'cloud security', 'endpoint security', 'zero trust',
    'defense in depth', 'security by design',

    // — Cryptography —
    'encryption', 'decryption', 'cryptography',
    '\\bssl\\b', '\\btls\\b', '\\bhttps\\b',
    '\\baes\\b', '\\brsa\\b', '\\becc\\b',
    '\\bsha\\b', '\\bmd5\\b', '\\bhmac\\b',
    'public key', 'private key', 'asymmetric encryption',
    'symmetric encryption', 'key management',
    'digital signature', 'certificate authority', '\\bpki\\b',
    'hashing', '\\bcryptographic\\b',
    '\\bjwt\\b', '\\boauth\\b', 'openid connect', '\\bsaml\\b',

    // — Penetration Testing & Offensive —
    'penetration testing', '\\bpentest\\b', 'pen test',
    'ethical hacking', 'red team', 'bug bounty',
    'exploit development', 'privilege escalation',
    '\\bmetasploit\\b', '\\bnmap\\b', '\\bburp suite\\b',
    '\\bwireshark\\b', '\\bkali linux\\b',
    '\\bnessus\\b', '\\bopenvas\\b',
    '\\bsqlmap\\b', '\\bhydra\\b', '\\bnikto\\b',
    '\\bmsfvenom\\b', '\\baircrack\\b',

    // — Vulnerabilities & Attacks —
    'vulnerability', 'vulnerability assessment',
    '\\bcve\\b', '\\bcvss\\b', '\\bowasp\\b',
    'sql injection', 'xss', 'cross[- ]site scripting',
    'csrf', 'cross[- ]site request forgery',
    '\\bxxe\\b', 'command injection', 'path traversal',
    'buffer overflow', 'memory corruption',
    'man[- ]in[- ]the[- ]middle', '\\bmitm\\b',
    'denial of service', '\\bdos\\b', '\\bddos\\b',
    'phishing', 'social engineering',
    'ransomware', 'malware', 'spyware', 'rootkit',
    'zero[- ]day', '\\b0day\\b',

    // — Defensive / Blue Team —
    'blue team', 'threat modeling', 'threat intelligence',
    'incident response', 'forensics', 'digital forensics',
    'security operations', '\\bsoc\\b',
    '\\bsiem\\b', 'log analysis', 'intrusion detection',
    '\\bids\\b', '\\bips\\b', '\\bwaf\\b', '\\bfirewall\\b',
    '\\bvpn\\b', 'network segmentation',
    '\\biam\\b', 'identity access management',
    'multi[- ]factor authentication', '\\bmfa\\b', '\\b2fa\\b',
    'role[- ]based access', '\\brbac\\b',
    'data loss prevention', '\\bdlp\\b',
    'security audit',

    // — Security Standards & Compliance —
    '\\bgdpr\\b', '\\bhipaa\\b', '\\bpci\\b', '\\bpci[- ]dss\\b',
    '\\biso 27001\\b', '\\bnist\\b', '\\bsoc 2\\b',
    '\\bfedramp\\b', '\\bcmmc\\b',

    // — Secure Development —
    'secure coding', 'code review', 'security review',
    'static analysis', '\\bsast\\b',
    'dynamic analysis', '\\bdast\\b',
    'software composition analysis', '\\bsca\\b',
    'secrets management', '\\bvault\\b', 'hashicorp vault',
    '\\bsnyk\\b', '\\bsonarqube\\b', '\\bcheckmarx\\b',
    'devsecops', 'shift left security',

    // =========================
    // 🧪 TESTING
    // =========================

    // — Test Types —
    'unit testing', 'integration testing',
    'e2e testing', 'end[- ]to[- ]end',
    'functional testing', 'regression testing',
    'smoke testing', 'sanity testing',
    'performance testing', 'load testing', 'stress testing',
    'security testing', 'fuzz testing', 'fuzzing',
    'mutation testing', 'snapshot testing',
    'acceptance testing', '\\buat\\b',
    'contract testing', 'api testing',
    'visual regression', 'accessibility testing',
    'chaos testing', 'chaos engineering',

    // — Test Methodologies —
    'test driven development', '\\btdd\\b',
    'behavior driven development', '\\bbdd\\b',
    'acceptance test driven', '\\batdd\\b',
    'shift left testing',
    'test coverage', 'code coverage',
    'mock', 'mocking', 'stub', 'stubbing',
    'spy', 'test double', 'fixture',

    // — JavaScript / TypeScript Testing —
    '\\bjest\\b', '\\bvitest\\b',
    '\\bmocha\\b', '\\bchai\\b',
    '\\bjasmine\\b', '\\bkarma\\b',
    '\\bsinon\\b', '\\bnock\\b',
    'testing library', 'react testing library',
    '\\bava\\b', '\\btape\\b',

    // — E2E / Browser Testing —
    '\\bcypress\\b', '\\bplaywright\\b',
    '\\bselenium\\b', '\\bwebdriver\\b',
    '\\bpuppeteer\\b', '\\bappium\\b',
    '\\btestcafe\\b', '\\bnightwatch\\b',
    '\\bstorybook\\b',

    // — Python Testing —
    '\\bpytest\\b', '\\bunittest\\b',
    '\\bnose\\b', '\\bnose2\\b',
    '\\bhypothesis\\b', '\\bbehave\\b',
    '\\brobotframework\\b', 'robot framework',
    '\\bmock\\b', '\\bmagicmock\\b',

    // — Java / JVM Testing —
    '\\bjunit\\b', '\\btestng\\b',
    '\\bmockito\\b', '\\bpowermock\\b',
    '\\bspock\\b', '\\bcucumber\\b',
    '\\bgatling\\b', '\\bassertj\\b',

    // — Performance & Load Testing —
    '\\bjmeter\\b', '\\bk6\\b',
    '\\blocust\\b', '\\bgatling\\b',
    '\\bartillery\\b', '\\bwrk\\b',

    // — API Testing —
    '\\bpostman\\b', '\\binsomnia\\b',
    '\\brestassured\\b', 'rest assured',
    '\\bpact\\b', 'contract testing',
    '\\bhttpie\\b', '\\bsupertest\\b',

    // — Mobile Testing —
    '\\bappium\\b', '\\bespresso\\b',
    '\\bxcuitest\\b', 'xctest',
    '\\bdetox\\b',

    // — .NET / C# Testing —
    '\\bnunit\\b', '\\bxunit\\b',
    '\\bmstest\\b', '\\bfluentassertions\\b',
    '\\bspecflow\\b', '\\bbogus\\b',

    // — Ruby Testing —
    '\\brspec\\b', '\\bminitest\\b',
    '\\bcapybara\\b', '\\bfactorybot\\b',

    // — PHP Testing —
    '\\bphpunit\\b', '\\bbehat\\b',
    '\\bcodception\\b',

    // — Code Quality & Static Analysis —
    '\\bsonarqube\\b', '\\bsonarcloud\\b',
    '\\beslint\\b', '\\bprettier\\b',
    '\\bpylint\\b', '\\bflake8\\b', '\\bmypy\\b',
    '\\bblack\\b', '\\bisort\\b',
    '\\brushfmt\\b', '\\bclipy\\b',
    '\\bcheckstyle\\b', '\\bspotbugs\\b',
    'code smell', 'technical debt',
    'static analysis', 'linting',

    // — CI Integration for Tests —
    'test automation', 'automated testing',
    'continuous testing', 'test pipeline',
    'test reporting', 'allure', '\\breportportal\\b',

    // =========================
    // 🧰 TOOLS
    // =========================

    // — Version Control —
    '\\bgit\\b', '\\bgithub\\b', '\\bgitlab\\b',
    '\\bbitbucket\\b', '\\bsvn\\b', '\\bsubversion\\b',
    '\\bmercurial\\b', '\\bperforce\\b',
    'git flow', 'trunk based development',
    'pull request', 'code review', 'merge request',

    // — Project Management & Collaboration —
    // '\\bjira\\b', '\\bconfluence\\b',
    // '\\btrello\\b', '\\basana\\b', '\\bnotion\\b',
    // '\\blinear\\b', '\\bclickup\\b', '\\bbasecamp\\b',
    // '\\bmonday\\b', 'monday\\.com',
    // '\\bslack\\b', 'microsoft teams',
    // '\\bdiscord\\b', '\\bzoom\\b',
    // '\\bfigma\\b', '\\bmiro\\b', '\\blucidchart\\b',
    // 'agile', 'scrum', 'kanban', 'sprint',
    // '\\bscrum master\\b', '\\bproduct owner\\b',

    // — API Development & Testing —
    '\\bpostman\\b', '\\binsomnia\\b',
    '\\bswagger\\b', '\\bopenapi\\b',
    '\\brapidapi\\b', '\\bhoppscotch\\b',
    '\\bthunder client\\b', '\\bhttpie\\b',
    '\\bgrpc\\b', '\\bprotobuf\\b',
    'api documentation', 'api design',
    '\\bstop light\\b', '\\bstoplight\\b',
    '\\breadme\\b', 'readme\\.io',

    // — IDEs & Code Editors —
    'vs code', 'vscode', 'visual studio code',
    '\\bintellij\\b', '\\bwebstorm\\b', '\\bpycharm\\b',
    '\\bgoland\\b', '\\bclion\\b', '\\bdatagrip\\b',
    '\\brider\\b', '\\bappcode\\b',
    '\\beclipse\\b', '\\bnetbeans\\b',
    '\\bvisual studio\\b',
    '\\bxcode\\b', '\\bandroid studio\\b',
    '\\bvim\\b', '\\bneovim\\b', '\\bemacs\\b',
    '\\bnano\\b', '\\bsublime\\b', 'sublime text',
    '\\batom\\b', '\\bbrackets\\b',
    '\\bcursor\\b', '\\bwindsurf\\b', '\\bzed\\b',
    'jetbrains', 'jetbrains ide',

    // — Notebooks & Data Exploration —
    '\\bjupyter\\b', 'jupyter notebook', 'jupyter lab',
    '\\bcolab\\b', 'google colab',
    '\\bkaggle\\b', 'kaggle notebook',
    '\\bdatabricks\\b', '\\bobservable\\b',
    '\\bhex\\b', '\\bdeepmind\\b', '\\bdeepnote\\b',
    '\\bzeppelin\\b', 'apache zeppelin',
    '\\bpapermil\\b', '\\bpapermill\\b',
    '\\bstreamlit\\b', '\\bgradio\\b',

    // — Design & Prototyping —
    '\\bfigma\\b', '\\bsketch\\b',
    '\\badobe xd\\b', '\\binvision\\b',
    '\\bzeplin\\b', '\\bframer\\b',
    '\\bcanva\\b', '\\bprocreate\\b',
    '\\bblender\\b', '\\bspline\\b',
    'ui design', 'ux design', 'wireframe', 'prototype',
    'design system', 'style guide',

    // — Documentation —
    '\\bconfluence\\b', '\\bnotion\\b',
    '\\breadme\\b', '\\bgitbook\\b',
    '\\bdocusaurus\\b', '\\bmkdocs\\b',
    '\\bsphinx\\b', '\\bjsdoc\\b',
    '\\btypedoc\\b', '\\bswagger\\b',
    '\\bstorybook\\b', '\\bzookeeper\\b',
    'technical writing', 'api docs',
    'markdown', '\\blatex\\b',

    // — Build Tools & Package Managers —
    '\\bnpm\\b', '\\byarn\\b', '\\bpnpm\\b', '\\bbun\\b',
    '\\bpip\\b', '\\bpoetry\\b', '\\bpipenv\\b', '\\bconda\\b',
    '\\bcargo\\b', '\\bgradle\\b', '\\bmaven\\b',
    '\\bant\\b', '\\bmake\\b', '\\bcmake\\b',
    '\\bbazel\\b', '\\bnix\\b',
    '\\bwebpack\\b', '\\bvite\\b', '\\brollup\\b',
    '\\bparcel\\b', '\\besbuild\\b', '\\bturbopack\\b',
    '\\bswc\\b', '\\bbabel\\b',

    // — Terminal & Shell Tools —
    '\\bbash\\b', '\\bzsh\\b', '\\bfish\\b',
    '\\btmux\\b', '\\bscreen\\b',
    '\\biterm\\b', '\\bwarp\\b', '\\bhyper\\b',
    '\\boh my zsh\\b', 'oh-my-zsh',
    '\\bhomebrew\\b', '\\bchocolatey\\b', '\\bwinget\\b',
    '\\bscoop\\b',
    'command line', 'cli', 'terminal',

    // — Monitoring & Observability —
    '\\bprometheus\\b', '\\bgrafana\\b',
    '\\bdatadog\\b', '\\bnew relic\\b', '\\bnewrelic\\b',
    '\\bsplunk\\b', '\\bpagerduty\\b',
    '\\bsentry\\b', '\\blogstash\\b',
    '\\bkibana\\b', '\\belastic\\b',
    '\\bopentelemetry\\b', '\\bjaeger\\b',
    '\\bzipkin\\b', '\\blightstep\\b',
    'application performance', '\\bapm\\b',
    'log management', 'error tracking',

    // — Collaboration & Communication —
    // '\\bslack\\b', '\\bteams\\b',
    // '\\bdiscord\\b', '\\bzoom\\b',
    // '\\bloom\\b', '\\blark\\b',
    // '\\blinear\\b', '\\bheight\\b',

    // — AI & Productivity Tools —
    '\\bchatgpt\\b', '\\bcopilot\\b', 'github copilot',
    '\\btabnine\\b', '\\bcodewhisperer\\b',
    '\\bcursor\\b', '\\bclaude\\b',
    '\\bv0\\b', '\\blovable\\b',
    'ai assisted', 'llm', 'generative ai',
    'prompt engineering',

    // — Database GUI & Management —
    '\\bdbeaver\\b', 'dbeaver',
    '\\btableplus\\b', 'table plus',
    '\\bpgadmin\\b', 'pg admin',
    '\\bmongodb compass\\b', 'mongo compass',
    '\\bredisinsight\\b', 'redis insight',
    '\\bsequelace\\b', 'sequel ace', 'sequel pro',
    '\\bnavicat\\b', '\\bworkbench\\b', 'mysql workbench',

    // — Diagramming & Architecture —
    '\\bdraw\\.io\\b', '\\bdiagrams\\.net\\b',
    '\\blucidchart\\b', '\\bmiro\\b',
    '\\bexcalidraw\\b', '\\bwhimsical\\b',
    '\\bplantum\\b', '\\bplantuml\\b', '\\bmermaid\\b',
    'system design', 'architecture diagram',
    '\\bc4 model\\b', 'uml',

    // — File & Data Transfer —
    '\\bftp\\b', '\\bsftp\\b', '\\bssh\\b',
    '\\brsync\\b', '\\bscp\\b',
    '\\bfilezilla\\b', '\\bcyberduck\\b',
    '\\bwinscp\\b',

    // — Browser & Web Dev Tools —
    'chrome devtools', 'browser devtools',
    '\\blighthouse\\b', '\\bpagespeed\\b',
    '\\bwebpack bundle analyzer\\b',
    '\\bcors\\b', '\\bdns\\b',
    '\\bngrok\\b', '\\blocaltunnel\\b',

    // =========================
    // 🧠 ROLES / CONTEXT TERMS
    // =========================

    // — Software Engineering —
    'frontend developer', 'front-end developer', 'front end developer',
    'backend developer', 'back-end developer', 'back end developer',
    'fullstack developer', 'full-stack developer', 'full stack developer',
    'software engineer', 'software developer', 'software architect',
    'solutions architect', 'technical architect', 'enterprise architect',
    'principal engineer', 'staff engineer', 'senior engineer',
    'junior developer', 'junior engineer', 'mid-level developer',
    'lead developer', 'lead engineer', 'tech lead', 'technical lead',
    '\\bswe\\b', '\\bsde\\b',

    // — Web Development —
    'web developer', 'web engineer',
    'ui developer', 'ui engineer',
    'ux developer', 'ux engineer',
    'ui\\/ux', 'ux\\/ui',
    'react developer', 'angular developer', 'vue developer',
    'node developer', 'node\\.js developer',
    'php developer', 'wordpress developer',
    'jamstack developer', 'headless cms',

    // — Mobile Development —
    'mobile developer', 'mobile engineer',
    'ios developer', 'ios engineer',
    'android developer', 'android engineer',
    'react native developer',
    'flutter developer',
    'cross[- ]platform developer',

    // — Data Roles —
    'data scientist', 'data analyst',
    'data engineer', 'data architect',
    'business intelligence', '\\bbi developer\\b',
    'analytics engineer', 'bi engineer',
    'database administrator', '\\bdba\\b',
    'etl developer', 'etl engineer',
    'data warehouse engineer',
    'reporting analyst', 'insights analyst',
    'quantitative analyst', 'quant analyst',
    '\\bmlops\\b', 'ml ops engineer',

    // — AI / ML Roles —
    'ml engineer', 'machine learning engineer',
    'ai engineer', 'artificial intelligence engineer',
    'deep learning engineer', 'nlp engineer',
    'computer vision engineer',
    'ai researcher', 'ml researcher',
    'research scientist', 'research engineer',
    'llm engineer', 'generative ai engineer',
    'prompt engineer',
    'ai product manager',

    // — DevOps / Infrastructure —
    'devops engineer', 'dev ops engineer',
    'cloud engineer', 'cloud architect',
    'site reliability engineer', '\\bsre\\b',
    'platform engineer', 'platform architect',
    'infrastructure engineer', 'systems engineer',
    'release engineer', 'build engineer',
    '\\bdevsecops\\b', 'devsecops engineer',
    'kubernetes engineer', 'docker engineer',

    // — Security Roles —
    'security engineer', 'security architect',
    'cybersecurity engineer', 'cybersecurity analyst',
    'information security', '\\bciso\\b',
    'penetration tester', 'ethical hacker',
    'red team engineer', 'blue team engineer',
    'security operations', 'soc analyst',
    'application security engineer', 'appsec engineer',
    'cloud security engineer',
    'devsecops engineer',

    // — QA / Testing Roles —
    'qa engineer', 'quality assurance engineer',
    'qa analyst', 'quality analyst',
    'test engineer', 'automation engineer',
    'sdet', 'software development engineer in test',
    'performance engineer', 'load test engineer',
    'test architect', 'qa lead', 'qa manager',

    // — Embedded / Hardware —
    'embedded engineer', 'embedded systems engineer',
    'firmware engineer', 'hardware engineer',
    '\\brtos\\b', 'iot engineer',
    'systems programmer', 'low[- ]level engineer',
    '\\bfpga\\b', 'robotics engineer',

    // — Product & Design —
    'product manager',
    'technical product manager',
    'product owner', 'program manager',
    'ux designer', 'ui designer',
    'product designer', 'interaction designer',
    'design lead', 'design systems',
    'growth engineer', 'growth hacker',

    // — Engineering Leadership —
    'engineering manager', '\\bem\\b',
    'vp of engineering', 'vp engineering',
    'director of engineering',
    'chief technology officer', '\\bcto\\b',
    'chief architect', 'distinguished engineer',
    'engineering director', 'head of engineering',

    // — Blockchain / Web3 —
    'blockchain developer', 'blockchain engineer',
    'smart contract developer', 'solidity developer',
    'web3 developer', 'web3 engineer',
    'defi engineer', 'nft developer',
    'crypto engineer',

    // — Game Development —
    'game developer', 'game engineer',
    'unity developer', 'unreal developer',
    'graphics engineer', 'rendering engineer',
    'gameplay engineer', 'game designer',
    '\\bgame dev\\b',

    // — Emerging & Specialized —
    'ar developer', 'vr developer',
    'xr developer', 'spatial computing',
    '\\bar\\/vr\\b', 'metaverse developer',
    'quantum developer', 'quantum engineer',
    'audio engineer', 'dsp engineer',

    // — Work Style / Seniority Context —
    // 'senior', '\\bsr\\.\\b', 'junior', '\\bjr\\.\\b',
    // 'mid[- ]level', 'associate',
    // 'principal', 'staff', 'distinguished',
    // 'intern', 'apprentice', 'graduate',
    // 'contractor', 'consultant', 'freelancer',
    // 'remote', 'hybrid', 'on[- ]site',
    // 'full[- ]time', 'part[- ]time',
    // 'open[- ]source contributor', 'open source',

    // — Methodologies / Work Context —
    'agile', 'scrum', 'kanban',
    '\\bsprint\\b', 'standup', 'retrospective',
    'pair programming', 'mob programming',
    'code review', 'technical interview',
    'system design', 'microservices',
    'domain driven design', '\\bddd\\b',
    'event driven', 'event sourcing',
    '\\bcqrs\\b', 'clean architecture',
    '\\bsolid\\b', 'design patterns',
    '\\boci\\b',

  ];

/**
 * Extract technical keywords from text using the pattern list
 * @param {string} text - Text to extract keywords from
 * @returns {Array<string>} - Array of found keywords
 */
function extractTechnicalKeywords(text) {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const foundKeywords = [];

  for (const pattern of TECHNICAL_PATTERNS) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    if (regex.test(textLower)) {
      // Normalize the keyword (remove regex escapes)
      const normalized = pattern.replace(/\\b|\\+|\\/g, '').replace(/\s+/g, ' ');
      if (!foundKeywords.includes(normalized)) {
        foundKeywords.push(normalized);
      }
    }
  }

  return foundKeywords.sort();
}

/**
 * Find common keywords between two sets
 * @param {Array<string>} set1 - First keyword set
 * @param {Array<string>} set2 - Second keyword set
 * @returns {Array<string>} - Common keywords
 */
function findCommonKeywords(set1, set2) {
  const set1Lower = new Set(set1.map(k => k.toLowerCase()));
  return set2.filter(k => set1Lower.has(k.toLowerCase()));
}

/**
 * Find missing keywords (in set2 but not in set1)
 * @param {Array<string>} set1 - First keyword set (e.g., resume)
 * @param {Array<string>} set2 - Second keyword set (e.g., JD)
 * @returns {Array<string>} - Missing keywords
 */
function findMissingKeywords(set1, set2) {
  const set1Lower = new Set(set1.map(k => k.toLowerCase()));
  return set2.filter(k => !set1Lower.has(k.toLowerCase()));
}

module.exports = {
  TECHNICAL_PATTERNS,
  extractTechnicalKeywords,
  findCommonKeywords,
  findMissingKeywords
};
