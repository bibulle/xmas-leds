# Project Rules for xmas-leds

## ⚠️ CRITICAL RULES - NEVER BREAK THESE

### 1. NO COMMITS WITHOUT USER TESTING
**NEVER EVER commit and push code without explicit user approval after local testing.**

This is a hardware project (LED control, camera, etc.) that MUST be tested on the actual hardware before any commit.

❌ **FORBIDDEN:**
- Committing after implementing a feature without user testing
- Pushing directly after changes
- Assuming code works because it compiles

✅ **REQUIRED:**
- Implement the feature/fix
- Wait for user to test on hardware
- Only commit after user confirms it works
- Get explicit user approval before pushing

### 2. User Has Already Reminded Me 5+ Times
If I commit without testing again, the user will lose trust in my ability to follow instructions.

## Workflow for Changes

1. **Implement** the requested changes
2. **Inform** the user the changes are ready
3. **WAIT** for user to test on their hardware
4. **ONLY THEN** commit if user approves
5. Get explicit confirmation before pushing

## Example of Correct Interaction

```
Claude: "J'ai implémenté la fonctionnalité X. Les fichiers modifiés sont:
- file1.ts
- file2.ts

Voulez-vous tester en local avant que je commit ?"

User: *tests on hardware*

User: "Ça marche bien, tu peux commiter"

Claude: *commits and pushes*
```

## Why This Matters

This is a **physical LED Christmas tree project** with:
- Hardware dependencies (LEDs, camera)
- Real-time control requirements
- Docker deployment to specific hardware
- Cannot be fully tested in CI/CD

**Breaking hardware is expensive and time-consuming to debug.**

## Reminder to Future Claude

READ THIS FILE EVERY TIME before committing anything in this project.
Ask yourself: "Has the user tested this on their hardware?"
If the answer is no, DO NOT COMMIT.
