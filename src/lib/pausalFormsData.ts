/**
 * Pausal-forms catalogue (Psalms only), embedded so the app needs no runtime
 * fetch or static asset. One record per line: `Ps <chapter>:<verse> <Accent Name>`
 * with optional trailing editorial markers (* ? !). Parse with
 * parsePausalCatalogue() in @/lib/pausalForms.
 *
 * Source: originally public/pausal_forms.txt. To regenerate after editing the
 * source text, replace the string below with the file contents verbatim.
 */
export const PAUSAL_FORMS_RAW = `
Ps 1:1 Etnachta
Ps 1:1 Sof Pasuq
Ps 1:2 Sof Pasuq
Ps 1:3 Ole VeYored
Ps 2:2 Etnachta
Ps 2:4 Etnachta
Ps 2:7 Etnachta*
Ps 2:8 Etnachta
Ps 2:8 Sof Pasuq
Ps 2:10 Sof Pasuq
Ps 3:2 Etnachta
Ps 3:2 Sof Pasuq
Ps 3:6 Ole VeYored
Ps 3:7 Etnachta?
Ps 3:7 Sof Pasuq
Ps 3:8 Etnachta
Ps 3:9 Munach
Ps 4:2 Dechi?
Ps 4:3 Munach?
Ps 4:5 Ole VeYored
Ps 4:8 Sof Pasuq
Ps 4:9 Ole VeYored
Ps 5:3 Etnachta
Ps 5:3 Sof Pasuq
Ps 5:5 Etnachta
Ps 5:5 Sof Pasuq?
Ps 5:8 Etnachta
Ps 5:8 Sof Pasuq
Ps 5:9 Revia
Ps 5:9 Etnachta
Ps 5:9 Sof Pasuq
Ps 5:11 Sof Pasuq
Ps 5:12 Pazer
Ps 5:12 Dechi
Ps 5:12 Sof Pasuq
Ps 6:3 Ole VeYored
Ps 6:3 Sof Pasuq
Ps 6:4 Sof Pasuq
Ps 6:5 Sof Pasuq
Ps 6:6 Etnachta
Ps 6:6 Sof Pasuq
Ps 6:8 Sof Pasuq
Ps 6:10 Sof Pasuq
Ps 6:11 Etnachta
Ps 6:11 Sof Pasuq
Ps 7:4 Sof Pasuq
Ps 7:5 Etnachta?
Ps 7:6 Etnachta
Ps 7:7 Revia
Ps 7:7 Etnachta
Ps 7:9 Sof Pasuq
Ps 7:14 Sof Pasuq
Ps 7:15 Sof Pasuq
Ps 7:16 Sof Pasuq
Ps 8:2 Sof Pasuq
Ps 8:4 Sof Pasuq
Ps 8:8 Sof Pasuq
Ps 9:3 Etnachta
Ps 9:6 Sof Pasuq
Ps 9:10 Etnachta?
Ps 9:11 Etnachta
Ps 9:13 Etnachta
Ps 9:14 Etnachta
Ps 9:15 Ole VeYored
Ps 9:15 Sof Pasuq
Ps 9:16 Revia Mugrash
Ps 10:2 Sof Pasuq
Ps 10:6 Sof Pasuq?
Ps 10:8 Sof Pasuq
Ps 10:12 Etnachta
Ps 10:14 Ole VeYored
Ps 10:14 Etnachta
Ps 10:15 Revia Mugrash?
Ps 10:16 Etnachta?
Ps 10:17 Sof Pasuq
Ps 10:18 Ole VeYored?
Ps 11:3 Etnachta?
Ps 11:3 Sof Pasuq
Ps 11:5 Ole VeYored
Ps 12:3 Sof Pasuq
Ps 12:7 Sof Pasuq
Ps 12:9 Etnachta?
Ps 13:3 Sof Pasuq
Ps 13:4 Etnachta
Ps 13:6 Ole VeYored
Ps 13:6 Sof Pasuq
Ps 14:3 Ole VeYored
Ps 14:4 Sof Pasuq
Ps 14:5 Etnachta
Ps 15:1 Etnachta
Ps 15:1 Sof Pasuq
Ps 15:5 Ole VeYored
Ps 16:1 Sof Pasuq
Ps 16:2 Etnachta
Ps 16:4 Ole VeYored
Ps 16:4 Sof Pasuq
Ps 16:6 Sof Pasuq
Ps 16:7 Etnachta
Ps 16:7 Sof Pasuq
Ps 16:10 Sof Pasuq
Ps 17:5 Sof Pasuq
Ps 17:7 Sof Pasuq
Ps 17:8 Etnachta
Ps 17:9 Sof Pasuq
Ps 17:13 Sof Pasuq
Ps 17:15 Sof Pasuq
Ps 18:4 Sof Pasuq
Ps 18:7 Ole VeYored
Ps 18:8 Etnachta
Ps 18:10 Etnachta
Ps 18:11 Etnachta
Ps 18:15 Revia Mugrash?
Ps 18:16 Sof Pasuq
Ps 18:18 Etnachta?
Ps 18:22 Sof Pasuq
Ps 18:26 Etnachta
Ps 18:26 Sof Pasuq
Ps 18:27 Etnachta
Ps 18:27 Sof Pasuq
Ps 18:33 Etnachta
Ps 18:35 Sof Pasuq
Ps 18:36 Ole VeYored
Ps 18:37 Etnachta
Ps 18:37 Sof Pasuq
Ps 18:39 Sof Pasuq
Ps 18:40 Sof Pasuq
Ps 18:44 Ole VeYored?
Ps 18:46 Etnachta
Ps 18:48 Sof Pasuq
Ps 18:49 Ole VeYored
Ps 18:50 Sof Pasuq
Ps 19:3 Sof Pasuq
Ps 19:8 Etnachta
Ps 19:8 Sof Pasuq
Ps 19:9 Sof Pasuq
Ps 19:11 Etnachta?
Ps 19:12 Sof Pasuq?
Ps 19:14 Revia
Ps 19:14 Sof Pasuq?
Ps 20:4 Etnachta!
Ps 20:5 Etnachta
Ps 20:6 Revia
Ps 20:9 Etnachta
Ps 20:9 Sof Pasuq
Ps 21:4 Sof Pasuq?
Ps 21:5 Sof Pasuq
Ps 21:6 Etnachta
Ps 21:12 Sof Pasuq
Ps 21:14 Etnachta
Ps 21:14 Sof Pasuq
Ps 22:2 Etnachta
Ps 22:6 Etnachta
Ps 22:10 Etnachta
Ps 22:11 Etnachta
Ps 22:11 Sof Pasuq
Ps 22:15 Ole VeYored
Ps 22:15 Sof Pasuq
Ps 22:16 Etnachta
Ps 22:17 Sof Pasuq
Ps 22:18 Etnachta
Ps 22:20 Etnachta
Ps 22:22 Sof Pasuq
Ps 22:23 Etnachta
Ps 22:25 Sof Pasuq
Ps 22:26 Etnachta?
Ps 22:27 Revia
Ps 22:28 Etnachta
Ps 23:1 Sof Pasuq
Ps 23:4 Revia?
Ps 23:4 Revia Mugrash
Ps 23:5 Etnachta
Ps 23:6 Etnachta
Ps 25:5 Azla Legarmeh
Ps 25:7 Etnachta*
Ps 25:8 Sof Pasuq
Ps 25:12 Sof Pasuq
Ps 25:13 Sof Pasuq
Ps 25:15 Sof Pasuq
Ps 25:16 Sof Pasuq
Ps 25:18 Sof Pasuq
Ps 25:19 Etnachta
Ps 25:20 Sof Pasuq
Ps 26:1 Sof Pasuq
Ps 26:3 Etnachta
Ps 26:3 Sof Pasuq
Ps 26:6 Etnachta
Ps 26:8 Etnachta
Ps 26:8 Sof Pasuq
Ps 26:9 Sof Pasuq
Ps 27:1 Sof Pasuq
Ps 27:2 Sof Pasuq
Ps 27:8 Etnachta
Ps 27:9 Ole VeYored
Ps 27:11 Ole VeYored
Ps 27:11 Sof Pasuq
Ps 27:12 Etnachta
Ps 27:14 Etnachta
Ps 28:2 Sof Pasuq
Ps 28:6 Sof Pasuq
Ps 28:7 Ole VeYored
Ps 28:9 Revia
Ps 28:9 Etnachta
Ps 29:3 Ole VeYored
Ps 29:10 Etnachta
Ps 30:2 Etnachta
Ps 30:3 Etnachta
Ps 30:6 Revia
Ps 30:9 Sof Pasuq
Ps 30:10 Ole VeYored
Ps 30:10 Sof Pasuq
Ps 31:4 Etnachta
Ps 31:7 Sof Pasuq
Ps 31:8 Ole VeYored
Ps 31:9 Sof Pasuq
Ps 31:11 Sof Pasuq
Ps 31:12 Ole VeYored
Ps 31:14 Sof Pasuq
Ps 31:15 Sof Pasuq
Ps 31:16 Etnachta
Ps 31:16 Sof Pasuq
Ps 31:17 Etnachta
Ps 31:17 Sof Pasuq
Ps 31:19 Ole VeYored
Ps 31:20 Etnachta
Ps 32:3 Etnachta
Ps 32:4 Ole VeYored
Ps 33:9 Etnachta
Ps 33:16 Etnachta
Ps 33:21 Sof Pasuq
Ps 33:22 Sof Pasuq
Ps 34:1 Sof Pasuq
Ps 34:3 Sof Pasuq
Ps 34:5 Etnachta
Ps 34:5 Sof Pasuq
Ps 34:6 Etnachta
Ps 34:6 Sof Pasuq
Ps 34:7 Etnachta
Ps 34:11 Etnachta
Ps 34:14 Etnachta?
Ps 34:15 Dechi?
Ps 34:17 Etnachta?
Ps 34:18 Etnachta
Ps 34:21 Sof Pasuq
Ps 34:22 Sof Pasuq
Ps 35:1 Sof Pasuq
Ps 35:3 Etnachta
Ps 35:3 Sof Pasuq
Ps 35:8 Ole VeYored
Ps 35:13 Revia?
Ps 35:14 Etnachta
Ps 35:15 Ole VeYored
Ps 35:15 Sof Pasuq
Ps 35:18 Etnachta?
Ps 35:19 Sof Pasuq
Ps 35:20 Ole VeYored
Ps 35:20 Sof Pasuq?
Ps 35:24 Revia
Ps 35:26 Sof Pasuq
Ps 35:28 Etnachta
Ps 35:28 Sof Pasuq
Ps 36:5 Revia Mugrash?
Ps 36:5 Sof Pasuq
Ps 36:6 Etnachta
Ps 36:7 Dechi
Ps 36:8 Sof Pasuq?
Ps 36:9 Etnachta
Ps 37:2 Etnachta
Ps 37:2 Sof Pasuq
Ps 37:4 Sof Pasuq
Ps 37:5 Etnachta
Ps 37:6 Etnachta
Ps 37:6 Revia Mugrash!
Ps 37:6 Sof Pasuq
Ps 37:9 Etnachta?
Ps 37:9 Sof Pasuq
Ps 37:11 Etnachta
Ps 37:14 Sof Pasuq
Ps 37:19 Sof Pasuq
Ps 37:20 Revia
Ps 37:22 Etnachta
Ps 37:22 Sof Pasuq
Ps 37:23 Revia
Ps 37:23 Sof Pasuq
Ps 37:24 Etnachta
Ps 37:25 Sof Pasuq
Ps 37:27 Dechi?
Ps 37:28 Etnachta
Ps 37:29 Etnachta
Ps 37:34 Etnachta
Ps 37:38 Sof Pasuq
Ps 38:3 Sof Pasuq
Ps 38:4 Etnachta
Ps 38:6 Etnachta
Ps 38:7 Sof Pasuq
Ps 38:10 Sof Pasuq
Ps 38:12 Etnachta
Ps 38:12 Sof Pasuq
Ps 38:14 Etnachta
Ps 38:16 Etnachta
Ps 38:16 Sof Pasuq
Ps 38:20 Etnachta
Ps 38:20 Sof Pasuq
Ps 39:5 Sof Pasuq
Ps 39:6 Etnachta
Ps 39:7 Etnachta?
Ps 39:11 Etnachta
Ps 39:13 Etnachta
Ps 39:13 Sof Pasuq
Ps 40:3 Sof Pasuq
Ps 40:4 Etnachta
Ps 40:6 Etnachta
Ps 40:7 Sof Pasuq
Ps 40:8 Sof Pasuq
Ps 40:9 Etnachta
Ps 40:9 Sof Pasuq
Ps 40:10 Revia?
Ps 40:10 Sof Pasuq
Ps 40:11 Etnachta
Ps 40:11 Sof Pasuq?
Ps 40:13 Sof Pasuq
Ps 40:17 Sof Pasuq
Ps 40:18 Etnachta*
Ps 41:2 Etnachta?
Ps 41:4 Etnachta
Ps 41:5 Sof Pasuq
Ps 41:8 Etnachta
Ps 41:12 Sof Pasuq
Ps 42:2 Etnachta
Ps 42:3 Ole VeYored
Ps 42:4 Etnachta
Ps 42:5 Tsinnor?
Ps 42:6 Ole VeYored
Ps 42:7 Ole VeYored
Ps 42:8 Sof Pasuq
Ps 42:9 Sof Pasuq
Ps 42:10 Ole VeYored
Ps 42:11 Etnachta
Ps 42:12 Ole VeYored
Ps 42:12 Sof Pasuq
Ps 43:2 Ole VeYored
Ps 43:4 Sof Pasuq
Ps 43:5 Ole VeYored
Ps 43:5 Sof Pasuq
Ps 44:4 Revia
Ps 44:6 Etnachta
Ps 44:7 Etnachta
Ps 44:11 Etnachta?
Ps 44:16 Sof Pasuq
Ps 44:18 Sof Pasuq
Ps 44:19 Sof Pasuq
Ps 44:27 Sof Pasuq
Ps 45:2 Dechi
Ps 45:4 Sof Pasuq
Ps 45:5 Sof Pasuq
Ps 45:7 Etnachta
Ps 45:7 Sof Pasuq
Ps 45:13 Sof Pasuq?
Ps 45:18 Sof Pasuq
Ps 46:3 Etnachta
Ps 46:7 Sof Pasuq
Ps 47:2 Etnachta?
Ps 47:7 Etnachta
Ps 47:7 Sof Pasuq
Ps 47:10 Revia
Ps 48:3 Sof Pasuq?
Ps 48:6 Etnachta
Ps 48:6 Sof Pasuq
Ps 48:7 Sof Pasuq
Ps 48:10 Etnachta
Ps 48:10 Sof Pasuq
Ps 48:11 Sof Pasuq
Ps 48:15 Etnachta
Ps 49:2 Sof Pasuq
Ps 49:6 Etnachta?
Ps 49:7 Sof Pasuq
Ps 49:10 Sof Pasuq
Ps 49:11 Etnachta
Ps 49:19 Sof Pasuq
Ps 50:1 Etnachta
Ps 50:2 Revia
Ps 50:4 Etnachta
Ps 50:5 Etnachta
Ps 50:5 Sof Pasuq
Ps 50:7 Revia
Ps 50:7 Etnachta
Ps 50:7 Sof Pasuq
Ps 50:8 Etnachta
Ps 50:9 Etnachta?
Ps 50:10 Etnachta
Ps 50:10 Sof Pasuq
Ps 50:12 Etnachta
Ps 50:16 Etnachta
Ps 50:18 Sof Pasuq
Ps 50:20 Sof Pasuq
Ps 50:23 Ole VeYored
Ps 51:2 Sof Pasuq
Ps 51:3 Etnachta
Ps 51:3 Sof Pasuq
Ps 51:5 Etnachta
Ps 51:6 Revia
Ps 51:6 Sof Pasuq
Ps 51:7 Etnachta
Ps 51:9 Etnachta
Ps 51:11 Etnachta
Ps 51:14 Etnachta
Ps 51:16 Sof Pasuq
Ps 51:17 Etnachta
Ps 51:17 Sof Pasuq
Ps 51:18 Etnachta
Ps 51:19 Ole VeYored
Ps 51:20 Sof Pasuq
Ps 52:4 Etnachta
Ps 52:5 Munach?
Ps 52:6 Revia
Ps 52:8 Revia
Ps 52:8 Sof Pasuq
Ps 52:10 Sof Pasuq
Ps 53:4 Ole VeYored
Ps 53:5 Sof Pasuq
Ps 53:6 Ole VeYored
Ps 53:6 Etnachta
Ps 54:7 Etnachta
Ps 54:8 Etnachta
Ps 54:9 Etnachta
Ps 55:5 Sof Pasuq
Ps 55:7 Sof Pasuq
Ps 55:9 Sof Pasuq
Ps 55:15 Sof Pasuq
Ps 55:23 Ole VeYored
Ps 55:24 Sof Pasuq
Ps 56:4 Sof Pasuq
Ps 56:6 Etnachta?
Ps 56:6 Sof Pasuq
Ps 56:7 Revia
Ps 56:7 Etnachta
Ps 56:9 Ole VeYored
Ps 56:9 Etnachta
Ps 56:9 Sof Pasuq
Ps 56:13 Sof Pasuq
Ps 56:14 Ole VeYored
Ps 57:3 Sof Pasuq
Ps 57:6 Sof Pasuq
Ps 57:8 Sof Pasuq
Ps 57:9 Sof Pasuq
Ps 57:11 Etnachta
Ps 57:11 Sof Pasuq
Ps 57:12 Sof Pasuq
Ps 58:2 Etnachta?
Ps 58:3 Ole VeYored?
Ps 58:3 Sof Pasuq?
Ps 58:4 Etnachta
Ps 58:8 Sof Pasuq
Ps 58:9 Sof Pasuq
Ps 59:2 Etnachta
Ps 59:5 Etnachta
Ps 59:7 Revia
Ps 59:10 Etnachta
Ps 59:11 Sof Pasuq
Ps 59:13 Sof Pasuq
Ps 59:15 Revia
Ps 59:17 Tsinnor
Ps 59:17 Ole VeYored
Ps 59:18 Etnachta
Ps 60:2 Sof Pasuq
Ps 60:8 Ole VeYored
Ps 60:10 Sof Pasuq
Ps 60:13 Etnachta
Ps 60:14 Etnachta
Ps 61:6 Etnachta
Ps 61:6 Sof Pasuq
Ps 62:5 Etnachta
Ps 62:9 Revia?
Ps 62:10 Sof Pasuq
Ps 62:11 Ole VeYored
Ps 62:12 Etnachta
Ps 62:13 Etnachta
Ps 63:2 Sof Pasuq
Ps 63:3 Sof Pasuq
Ps 63:5 Etnachta
Ps 63:5 Sof Pasuq
Ps 63:7 Etnachta
Ps 63:7 Sof Pasuq
Ps 63:9 Sof Pasuq
Ps 63:11 Etnachta
Ps 63:12 Sof Pasuq
Ps 64:2 Sof Pasuq
Ps 64:4 Sof Pasuq?
Ps 64:5 Sof Pasuq
Ps 64:6 Revia?
Ps 65:5 Etnachta
Ps 65:5 Sof Pasuq
Ps 65:10 Etnachta
Ps 65:12 Etnachta
Ps 65:12 Sof Pasuq
Ps 66:4 Etnachta
Ps 66:6 Etnachta
Ps 66:10 Sof Pasuq
Ps 66:13 Sof Pasuq
Ps 66:14 Etnachta
Ps 66:15 Dechi
Ps 67:3 Etnachta
Ps 67:3 Sof Pasuq
Ps 67:8 Sof Pasuq
Ps 68:8 Etnachta
Ps 68:9 Azla Legarmeh
Ps 68:12 Sof Pasuq?
Ps 68:13 Munach?
Ps 68:13 Etnachta?
Ps 68:14 Ole VeYored
Ps 68:19 Revia
Ps 68:29 Ole VeYored
Ps 68:30 Dechi
Ps 68:30 Etnachta
Ps 68:30 Sof Pasuq
Ps 68:31 Etnachta
Ps 68:31 Sof Pasuq
Ps 68:32 Etnachta
Ps 69:2 Sof Pasuq
Ps 69:3 Sof Pasuq
Ps 69:4 Sof Pasuq
Ps 69:6 Sof Pasuq
Ps 69:8 Sof Pasuq
Ps 69:9 Etnachta
Ps 69:10 Etnachta
Ps 69:10 Sof Pasuq
Ps 69:12 Etnachta?
Ps 69:13 Etnachta
Ps 69:14 Etnachta
Ps 69:14 Sof Pasuq
Ps 69:15 Etnachta
Ps 69:15 Sof Pasuq
Ps 69:17 Etnachta
Ps 69:17 Sof Pasuq
Ps 69:18 Etnachta
Ps 69:20 Sof Pasuq
Ps 69:23 Etnachta?
Ps 69:25 Etnachta
Ps 69:27 Etnachta
Ps 69:27 Sof Pasuq
Ps 69:28 Sof Pasuq
Ps 69:29 Sof Pasuq
Ps 69:32 Revia Mugrash?
Ps 69:33 Etnachta
Ps 69:35 Etnachta
Ps 70:5 Sof Pasuq
Ps 70:6 Etnachta*
Ps 71:3 Sof Pasuq
Ps 71:5 Sof Pasuq
Ps 71:8 Etnachta
Ps 71:8 Sof Pasuq
Ps 71:14 Sof Pasuq
Ps 71:15 Revia
Ps 71:15 Etnachta
Ps 71:16 Sof Pasuq
Ps 71:17 Etnachta
Ps 71:18 Sof Pasuq
Ps 71:22 Ole VeYored
Ps 71:23 Etnachta
Ps 71:24 Etnachta
Ps 72:5 Etnachta
Ps 72:6 Sof Pasuq
Ps 72:8 Sof Pasuq
Ps 72:9 Sof Pasuq
Ps 72:20 Sof Pasuq
Ps 73:2 Etnachta
Ps 73:2 Sof Pasuq
Ps 73:5 Sof Pasuq
Ps 73:8 Munach?
Ps 73:8 Sof Pasuq
Ps 73:12 Sof Pasuq
Ps 73:13 Sof Pasuq
Ps 73:15 Sof Pasuq
Ps 73:16 Sof Pasuq
Ps 73:19 Etnachta
Ps 73:21 Sof Pasuq
Ps 73:22 Etnachta
Ps 73:22 Sof Pasuq
Ps 73:23 Etnachta
Ps 73:25 Etnachta
Ps 73:27 Etnachta
Ps 73:27 Sof Pasuq
Ps 74:1 Sof Pasuq
Ps 74:2 Etnachta
Ps 74:4 Etnachta
Ps 74:5 Etnachta
Ps 74:6 Etnachta
Ps 74:6 Sof Pasuq?
Ps 74:7 Etnachta
Ps 74:7 Sof Pasuq
Ps 74:8 Etnachta
Ps 74:10 Etnachta?
Ps 74:11 Etnachta
Ps 74:13 Sof Pasuq
Ps 74:15 Etnachta
Ps 74:16 Etnachta
Ps 74:16 Sof Pasuq
Ps 74:17 Etnachta
Ps 74:18 Sof Pasuq
Ps 74:19 Etnachta
Ps 74:21 Sof Pasuq
Ps 74:22 Etnachta
Ps 75:2 Etnachta
Ps 75:5 Sof Pasuq
Ps 75:9 Sof Pasuq
Ps 75:11 Etnachta
Ps 76:4 Etnachta
Ps 76:5 Sof Pasuq
Ps 76:8 Revia*
Ps 76:8 Sof Pasuq
Ps 76:9 Sof Pasuq
Ps 76:13 Sof Pasuq
Ps 77:2 Etnachta
Ps 77:2 Sof Pasuq
Ps 77:3 Ole VeYored
Ps 77:5 Etnachta
Ps 77:7 Ole VeYored
Ps 77:12 Sof Pasuq
Ps 77:13 Etnachta
Ps 77:14 Etnachta
Ps 77:15 Sof Pasuq
Ps 77:16 Etnachta
Ps 77:18 Sof Pasuq
Ps 77:20 Revia
Ps 77:20 Sof Pasuq
Ps 77:21 Etnachta
Ps 78:6 Etnachta
Ps 78:7 Sof Pasuq
Ps 78:9 Etnachta
Ps 78:16 Etnachta
Ps 78:16 Sof Pasuq
Ps 78:20 Ole VeYored
Ps 78:21 Ole VeYored
Ps 78:23 Etnachta
Ps 78:23 Sof Pasuq
Ps 78:26 Etnachta
Ps 78:42 Sof Pasuq?
Ps 78:44 Sof Pasuq?
Ps 78:51 Etnachta
Ps 78:53 Etnachta
Ps 78:56 Sof Pasuq
Ps 78:57 Munach
Ps 78:59 Etnachta
Ps 78:61 Sof Pasuq?
Ps 78:62 Sof Pasuq
Ps 78:63 Sof Pasuq
Ps 78:64 Etnachta
Ps 78:65 Sof Pasuq
Ps 78:67 Sof Pasuq
Ps 79:1 Revia
Ps 79:1 Etnachta
Ps 79:2 Etnachta
Ps 79:2 Sof Pasuq
Ps 79:3 Revia
Ps 79:5 Sof Pasuq
Ps 79:6 Sof Pasuq
Ps 79:9 Etnachta
Ps 79:9 Sof Pasuq
Ps 79:13 Tsinnor
Ps 79:13 Sof Pasuq
Ps 80:3 Etnachta
Ps 80:4 Sof Pasuq
Ps 80:5 Sof Pasuq
Ps 80:8 Sof Pasuq
Ps 80:10 Sof Pasuq
Ps 80:13 Sof Pasuq
Ps 80:14 Etnachta
Ps 80:16 Etnachta
Ps 80:16 Sof Pasuq
Ps 80:17 Sof Pasuq
Ps 80:18 Etnachta
Ps 80:18 Sof Pasuq
Ps 80:19 Etnachta
Ps 80:20 Sof Pasuq
Ps 81:3 Sof Pasuq
Ps 81:6 Etnachta
Ps 81:6 Sof Pasuq
Ps 81:9 Etnachta
Ps 81:11 Etnachta
Ps 81:14 Sof Pasuq
Ps 81:17 Sof Pasuq
Ps 82:5 Etnachta
Ps 82:5 Sof Pasuq
Ps 82:7 Sof Pasuq
Ps 83:2 Etnachta
Ps 83:3 Etnachta?
Ps 83:6 Sof Pasuq
Ps 83:15 Etnachta
Ps 83:16 Etnachta
Ps 83:18 Sof Pasuq
Ps 83:19 Etnachta
Ps 84:3 Sof Pasuq
Ps 84:4 Sof Pasuq
Ps 84:5 Etnachta
Ps 84:6 Etnachta
Ps 84:8 Etnachta
Ps 84:10 Sof Pasuq
Ps 84:11 Ole VeYored
Ps 84:13 Sof Pasuq
Ps 85:2 Etnachta
Ps 85:3 Etnachta
Ps 85:4 Etnachta
Ps 85:4 Sof Pasuq
Ps 85:7 Sof Pasuq
Ps 85:8 Etnachta
Ps 85:11 Etnachta
Ps 85:11 Sof Pasuq
Ps 85:12 Etnachta
Ps 85:12 Sof Pasuq
Ps 86:1 Sof Pasuq
Ps 86:2 Ole VeYored
Ps 86:4 Etnachta
Ps 86:6 Sof Pasuq
Ps 86:9 Sof Pasuq
Ps 86:10 Sof Pasuq
Ps 86:11 Revia
Ps 86:11 Etnachta
Ps 86:11 Sof Pasuq
Ps 86:13 Etnachta
Ps 86:16 Etnachta
Ps 86:16 Sof Pasuq
Ps 86:17 Sof Pasuq
Ps 87:3 Etnachta
Ps 87:4 Ole VeYored
Ps 87:7 Sof Pasuq
Ps 88:2 Sof Pasuq
Ps 88:6 Sof Pasuq
Ps 88:8 Etnachta
Ps 88:10 Ole VeYored
Ps 88:10 Sof Pasuq
Ps 88:12 Etnachta
Ps 88:13 Etnachta
Ps 88:18 Sof Pasuq
Ps 89:5 Etnachta
Ps 89:11 Etnachta
Ps 89:12 Etnachta
Ps 89:13 Sof Pasuq
Ps 89:14 Sof Pasuq
Ps 89:15 Etnachta
Ps 89:16 Sof Pasuq?
Ps 89:18 Etnachta
Ps 89:20 Sof Pasuq?
Ps 89:27 Etnachta
Ps 89:28 Dechi
Ps 89:28 Sof Pasuq
Ps 89:30 Sof Pasuq
Ps 89:31 Sof Pasuq?
Ps 89:32 Etnachta
Ps 89:32 Sof Pasuq
Ps 89:39 Etnachta
Ps 89:39 Sof Pasuq
Ps 89:40 Etnachta
Ps 89:42 Etnachta
Ps 89:47 Sof Pasuq
Ps 89:48 Etnachta
Ps 89:50 Sof Pasuq
Ps 89:52 Sof Pasuq
Ps 90:2 Revia
Ps 90:4 Sof Pasuq
Ps 90:6 Etnachta
Ps 90:7 Etnachta
Ps 90:7 Sof Pasuq
Ps 90:8 Etnachta
Ps 90:9 Etnachta
Ps 90:11 Etnachta
Ps 90:11 Sof Pasuq
Ps 90:13 Etnachta
Ps 90:14 Etnachta
Ps 90:16 Etnachta
Ps 91:1 Sof Pasuq
Ps 91:4 Dechi
Ps 91:5 Etnachta
Ps 91:6 Sof Pasuq
Ps 91:7 Etnachta
Ps 91:7 Sof Pasuq
Ps 91:9 Sof Pasuq
Ps 91:10 Sof Pasuq
Ps 91:11 Etnachta
Ps 91:12 Sof Pasuq
Ps 92:3 Etnachta
Ps 92:4 Etnachta
Ps 92:5 Etnachta
Ps 92:7 Etnachta
Ps 92:10 Etnachta
Ps 92:12 Ole VeYored
Ps 92:12 Sof Pasuq
Ps 92:13 Etnachta
Ps 93:1 Tsinnor
Ps 93:1 Etnachta
Ps 93:2 Sof Pasuq
Ps 94:3 Sof Pasuq
Ps 94:6 Etnachta
Ps 94:6 Sof Pasuq
Ps 94:8 Etnachta?
Ps 94:9 Etnachta
Ps 94:10 Sof Pasuq
Ps 94:11 Sof Pasuq
Ps 94:13 Etnachta?
Ps 94:13 Sof Pasuq
Ps 95:4 Etnachta
Ps 95:5 Sof Pasuq
Ps 95:6 Etnachta
Ps 95:7 Sof Pasuq
Ps 95:10 Sof Pasuq
Ps 96:10 Revia
Ps 96:12 Sof Pasuq
Ps 97:1 Dechi
Ps 97:10 Ole VeYored?
Ps 98:3 Etnachta
Ps 98:4 Sof Pasuq
Ps 98:8 Etnachta?
Ps 98:8 Sof Pasuq
Ps 99:1 Dechi
Ps 101:1 Sof Pasuq
Ps 101:2 Etnachta
Ps 101:3 Ole VeYored
Ps 101:4 Revia Mugrash?
Ps 101:4 Sof Pasuq
Ps 101:5 Sof Pasuq
Ps 101:7 Sof Pasuq
Ps 101:8 Etnachta
Ps 102:3 Etnachta
Ps 102:4 Etnachta
Ps 102:4 Sof Pasuq
Ps 102:8 Sof Pasuq?
Ps 102:9 Etnachta
Ps 102:9 Sof Pasuq
Ps 102:10 Etnachta
Ps 102:10 Sof Pasuq
Ps 102:11 Etnachta
Ps 102:12 Sof Pasuq
Ps 102:15 Sof Pasuq
Ps 102:16 Sof Pasuq
Ps 102:22 Sof Pasuq
Ps 102:24 Sof Pasuq
Ps 102:25 Etnachta
Ps 102:26 Sof Pasuq
Ps 102:27 Tsinnor
Ps 102:27 Sof Pasuq
Ps 102:28 Sof Pasuq
Ps 102:29 Etnachta
Ps 103:3 Sof Pasuq
Ps 103:4 Etnachta
Ps 103:5 Sof Pasuq
Ps 103:8 Sof Pasuq
Ps 103:14 Sof Pasuq
Ps 103:19 Sof Pasuq
Ps 104:1 Sof Pasuq
Ps 104:5 Sof Pasuq
Ps 104:6 Sof Pasuq
Ps 104:7 Sof Pasuq?
Ps 104:9 Etnachta?
Ps 104:10 Sof Pasuq?
Ps 104:11 Etnachta
Ps 104:15 Etnachta
Ps 104:15 Sof Pasuq
Ps 104:16 Sof Pasuq
Ps 104:17 Etnachta
Ps 104:20 Etnachta
Ps 104:20 Sof Pasuq
Ps 104:21 Etnachta
Ps 104:22 Etnachta?
Ps 104:22 Sof Pasuq?
Ps 104:23 Sof Pasuq
Ps 104:24 Sof Pasuq
Ps 104:25 Ole VeYored
Ps 104:26 Etnachta?
Ps 104:27 Etnachta?
Ps 104:28 Etnachta?
Ps 104:29 Ole VeYored?
Ps 104:29 Etnachta?
Ps 104:30 Etnachta?
Ps 104:32 Etnachta
Ps 104:32 Sof Pasuq
Ps 104:33 Etnachta
Ps 105:11 Etnachta
Ps 105:15 Etnachta
Ps 105:16 Sof Pasuq
Ps 105:19 Sof Pasuq
Ps 105:23 Etnachta
Ps 105:39 Sof Pasuq
Ps 105:41 Etnachta
Ps 105:44 Sof Pasuq
Ps 105:45 Revia
Ps 106:4 Etnachta
Ps 106:4 Sof Pasuq
Ps 106:5 Etnachta
Ps 106:5 Sof Pasuq
Ps 106:6 Sof Pasuq
Ps 106:9 Etnachta
Ps 106:21 Sof Pasuq
Ps 106:38 Etnachta
Ps 106:47 Etnachta
Ps 106:47 Sof Pasuq
Ps 107:2 Sof Pasuq?
Ps 107:4 Etnachta
Ps 107:4 Sof Pasuq
Ps 107:5 Sof Pasuq
Ps 107:11 Sof Pasuq
Ps 107:16 Sof Pasuq
Ps 107:26 Sof Pasuq
Ps 107:27 Sof Pasuq
Ps 107:30 Etnachta
Ps 107:32 Etnachta?
Ps 107:35 Sof Pasuq
Ps 107:40 Sof Pasuq
Ps 107:41 Etnachta
Ps 107:42 Etnachta
Ps 108:3 Sof Pasuq
Ps 108:5 Etnachta
Ps 108:5 Sof Pasuq
Ps 108:6 Sof Pasuq
Ps 108:8 Ole VeYored
Ps 108:10 Sof Pasuq
Ps 108:13 Etnachta?
Ps 108:14 Etnachta
Ps 109:2 Etnachta
Ps 109:2 Sof Pasuq
Ps 109:10 Etnachta
Ps 109:12 Etnachta
Ps 109:14 Sof Pasuq
Ps 109:16 Ole VeYored
Ps 109:20 Revia Mugrash?
Ps 109:21 Etnachta
Ps 109:22 Etnachta
Ps 109:23 Etnachta
Ps 109:24 Sof Pasuq
Ps 109:26 Etnachta
Ps 109:26 Sof Pasuq
Ps 109:28 Sof Pasuq
Ps 110:3 Ole VeYored
Ps 112:2 Sof Pasuq
Ps 112:10 Revia
Ps 112:10 Etnachta
Ps 113:5 Sof Pasuq
Ps 113:7 Etnachta?
Ps 114:1 Etnachta
Ps 114:3 Etnachta
Ps 114:7 Etnachta
Ps 114:8 Etnachta
Ps 114:8 Sof Pasuq
Ps 115:1 Sof Pasuq
Ps 115:3 Etnachta
Ps 115:5 Etnachta
Ps 115:6 Etnachta
Ps 115:7 Etnachta
Ps 115:15 Sof Pasuq
Ps 116:1 Sof Pasuq
Ps 116:7 Etnachta
Ps 116:7 Sof Pasuq
Ps 116:8 Sof Pasuq
Ps 116:12 Sof Pasuq
Ps 116:16 Ole VeYored
Ps 116:16 Etnachta
Ps 116:16 Sof Pasuq
Ps 116:19 Revia
Ps 118:5 Tarcha
Ps 118:7 Etnachta
Ps 118:7 Sof Pasuq
Ps 118:13 Sof Pasuq
Ps 118:15 Sof Pasuq
Ps 118:16 Etnachta
Ps 118:16 Sof Pasuq
Ps 118:18 Sof Pasuq
Ps 118:21 Etnachta
Ps 119:1 Etnachta
Ps 119:3 Sof Pasuq
Ps 119:5 Revia
Ps 119:7 Sof Pasuq
Ps 119:9 Sof Pasuq
Ps 119:11 Etnachta
Ps 119:11 Sof Pasuq
Ps 119:16 Etnachta
Ps 119:16 Sof Pasuq
Ps 119:17 Sof Pasuq
Ps 119:18 Sof Pasuq
Ps 119:22 Sof Pasuq
Ps 119:23 Etnachta
Ps 119:24 Revia
Ps 119:25 Sof Pasuq
Ps 119:28 Sof Pasuq
Ps 119:30 Etnachta
Ps 119:34 Revia
Ps 119:35 Sof Pasuq
Ps 119:36 Sof Pasuq
Ps 119:37 Merkha!
Ps 119:38 Etnachta
Ps 119:38 Sof Pasuq
Ps 119:41 Sof Pasuq
Ps 119:42 Sof Pasuq
Ps 119:43 Munach!
Ps 119:43 Sof Pasuq
Ps 119:44 Sof Pasuq
Ps 119:45 Sof Pasuq
Ps 119:47 Sof Pasuq
Ps 119:48 Revia
Ps 119:49 Etnachta
Ps 119:49 Sof Pasuq
Ps 119:50 Sof Pasuq
Ps 119:52 Sof Pasuq
Ps 119:53 Sof Pasuq
Ps 119:54 Sof Pasuq
Ps 119:55 Sof Pasuq
Ps 119:56 Sof Pasuq
Ps 119:58 Sof Pasuq
Ps 119:59 Etnachta
Ps 119:60 Etnachta
Ps 119:61 Sof Pasuq
Ps 119:62 Etnachta
Ps 119:62 Sof Pasuq
Ps 119:63 Dechi
Ps 119:65 Sof Pasuq
Ps 119:66 Sof Pasuq
Ps 119:67 Sof Pasuq
Ps 119:70 Sof Pasuq
Ps 119:72 Sof Pasuq
Ps 119:74 Etnachta
Ps 119:74 Sof Pasuq
Ps 119:75 Sof Pasuq
Ps 119:76 Sof Pasuq
Ps 119:77 Sof Pasuq
Ps 119:81 Sof Pasuq
Ps 119:82 Etnachta
Ps 119:83 Sof Pasuq
Ps 119:84 Etnachta
Ps 119:85 Sof Pasuq
Ps 119:89 Sof Pasuq
Ps 119:90 Etnachta
Ps 119:92 Etnachta
Ps 119:93 Sof Pasuq
Ps 119:94 Sof Pasuq
Ps 119:95 Sof Pasuq
Ps 119:97 Etnachta
Ps 119:98 Etnachta!
Ps 119:100 Etnachta
Ps 119:100 Sof Pasuq
Ps 119:101 Dechi?
Ps 119:101 Etnachta
Ps 119:101 Sof Pasuq
Ps 119:102 Etnachta
Ps 119:102 Sof Pasuq
Ps 119:103 Revia
Ps 119:104 Etnachta
Ps 119:104 Sof Pasuq
Ps 119:105 Etnachta
Ps 119:106 Etnachta
Ps 119:106 Sof Pasuq
Ps 119:107 Sof Pasuq
Ps 119:109 Sof Pasuq
Ps 119:113 Sof Pasuq
Ps 119:114 Etnachta
Ps 119:114 Sof Pasuq
Ps 119:115 Sof Pasuq
Ps 119:117 Etnachta
Ps 119:119 Etnachta
Ps 119:121 Sof Pasuq
Ps 119:123 Etnachta
Ps 119:123 Sof Pasuq
Ps 119:124 Revia
Ps 119:125 Merkha
Ps 119:126 Sof Pasuq
Ps 119:127 Sof Pasuq?
Ps 119:128 Etnachta
Ps 119:130 Etnachta
Ps 119:131 Etnachta
Ps 119:131 Sof Pasuq
Ps 119:132 Sof Pasuq
Ps 119:133 Etnachta
Ps 119:135 Etnachta
Ps 119:136 Etnachta
Ps 119:136 Sof Pasuq
Ps 119:139 Sof Pasuq
Ps 119:141 Sof Pasuq
Ps 119:143 Sof Pasuq
Ps 119:145 Sof Pasuq
Ps 119:147 Etnachta
Ps 119:147 Sof Pasuq
Ps 119:148 Sof Pasuq
Ps 119:149 Etnachta
Ps 119:149 Merkha!
Ps 119:150 Sof Pasuq
Ps 119:153 Sof Pasuq
Ps 119:155 Sof Pasuq
Ps 119:157 Etnachta
Ps 119:158 Etnachta
Ps 119:158 Sof Pasuq
Ps 119:159 Etnachta
Ps 119:160 Sof Pasuq
Ps 119:162 Etnachta
Ps 119:162 Sof Pasuq?
Ps 119:163 Etnachta
Ps 119:163 Sof Pasuq
Ps 119:164 Sof Pasuq
Ps 119:165 Dechi?
Ps 119:165 Etnachta
Ps 119:168 Sof Pasuq
Ps 119:172 Etnachta
Ps 119:173 Sof Pasuq
Ps 119:174 Sof Pasuq
Ps 119:175 Merkha!
Ps 119:176 Etnachta
Ps 119:176 Sof Pasuq
Ps 120:3 Revia
Ps 121:2 Sof Pasuq
Ps 121:3 Etnachta
Ps 121:3 Sof Pasuq
Ps 121:4 Etnachta
Ps 121:5 Etnachta
Ps 121:5 Sof Pasuq
Ps 121:6 Sof Pasuq
Ps 121:7 Etnachta?
Ps 121:7 Sof Pasuq
Ps 121:8 Etnachta
Ps 122:2 Sof Pasuq
Ps 122:6 Etnachta
Ps 122:6 Sof Pasuq
Ps 122:7 Sof Pasuq
Ps 122:8 Etnachta
Ps 123:1 Sof Pasuq
Ps 124:7 Sof Pasuq
Ps 124:8 Sof Pasuq
Ps 126:5 Sof Pasuq
Ps 126:6 Ole VeYored
Ps 127:3 Sof Pasuq
Ps 127:5 Sof Pasuq
Ps 128:2 Sof Pasuq
Ps 128:3 Ole VeYored
Ps 128:3 Sof Pasuq
Ps 128:4 Revia
Ps 128:5 Etnachta
Ps 129:2 Etnachta
Ps 130:2 Sof Pasuq
Ps 130:5 Sof Pasuq
Ps 132:3 Sof Pasuq
Ps 132:4 Etnachta
Ps 132:6 Sof Pasuq
Ps 132:8 Etnachta
Ps 132:8 Sof Pasuq
Ps 132:9 Sof Pasuq
Ps 132:10 Etnachta
Ps 132:10 Sof Pasuq
Ps 132:11 Sof Pasuq
Ps 132:12 Sof Pasuq
Ps 132:15 Sof Pasuq
Ps 132:16 Sof Pasuq
Ps 133:1 Sof Pasuq
Ps 134:3 Sof Pasuq
Ps 135:8 Etnachta
Ps 135:9 Etnachta
Ps 135:11 Sof Pasuq
Ps 135:14 Sof Pasuq
Ps 135:16 Etnachta
Ps 135:21 Revia
Ps 136:6 Etnachta
Ps 136:9 Etnachta
Ps 136:26 Etnachta
Ps 137:5 Revia
Ps 137:7 Ole VeYored
Ps 137:9 Sof Pasuq
Ps 138:2 Revia
Ps 138:2 Etnachta
Ps 138:2 Sof Pasuq
Ps 138:4 Etnachta
Ps 138:6 Sof Pasuq
Ps 138:7 Etnachta
Ps 138:7 Sof Pasuq
Ps 139:1 Sof Pasuq
Ps 139:5 Etnachta
Ps 139:5 Sof Pasuq
Ps 139:7 Etnachta
Ps 139:7 Sof Pasuq
Ps 139:8 Etnachta
Ps 139:8 Sof Pasuq
Ps 139:9 Etnachta
Ps 139:10 Sof Pasuq
Ps 139:12 Ole VeYored
Ps 139:13 Etnachta
Ps 139:15 Ole VeYored
Ps 139:15 Sof Pasuq
Ps 139:16 Ole VeYored
Ps 139:16 Etnachta
Ps 139:18 Sof Pasuq
Ps 139:21 Sof Pasuq
Ps 139:23 Sof Pasuq
Ps 140:2 Etnachta?
Ps 140:5 Sof Pasuq
Ps 140:7 Etnachta
Ps 140:7 Sof Pasuq
Ps 140:8 Sof Pasuq
Ps 140:10 Etnachta
Ps 140:12 Etnachta?
Ps 140:14 Etnachta
Ps 141:1 Sof Pasuq
Ps 141:2 Sof Pasuq
Ps 141:3 Sof Pasuq
Ps 141:4 Pazer?
Ps 141:6 Sof Pasuq
Ps 141:8 Etnachta
Ps 142:2 Etnachta
Ps 142:2 Sof Pasuq
Ps 142:8 Ole VeYored
Ps 142:8 Sof Pasuq
Ps 143:1 Sof Pasuq
Ps 143:2 Etnachta
Ps 143:2 Sof Pasuq
Ps 143:5 Etnachta
Ps 143:5 Sof Pasuq
Ps 143:8 Tsinnor
Ps 143:8 Ole VeYored
Ps 143:10 Tsinnor
Ps 143:10 Ole VeYored
Ps 143:12 Ole VeYored
Ps 143:12 Sof Pasuq
Ps 144:2 Sof Pasuq
Ps 144:5 Sof Pasuq
Ps 144:8 Sof Pasuq
Ps 144:9 Etnachta
Ps 144:9 Sof Pasuq
Ps 144:11 Sof Pasuq
Ps 145:1 Sof Pasuq
Ps 145:2 Sof Pasuq
Ps 145:5 Etnachta
Ps 145:6 Etnachta
Ps 145:7 Sof Pasuq
Ps 145:8 Sof Pasuq
Ps 145:11 Etnachta
Ps 145:11 Sof Pasuq
Ps 145:15 Etnachta
Ps 145:16 Etnachta
Ps 145:21 Sof Pasuq
Ps 146:2 Etnachta
Ps 146:6 Revia
Ps 147:6 Sof Pasuq
Ps 147:9 Sof Pasuq
Ps 147:10 Etnachta
Ps 147:13 Etnachta
Ps 147:15 Etnachta
Ps 147:16 Etnachta
Ps 147:18 Sof Pasuq
Ps 148:4 Etnachta
Ps 148:4 Sof Pasuq
Ps 148:5 Sof Pasuq
Ps 148:11 Sof Pasuq
Ps 148:13 Sof Pasuq
Ps 150:5 Etnachta
`;
