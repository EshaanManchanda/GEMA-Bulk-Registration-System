# Claude Code Rules

## Communication
- Extreme brevity, sacrifice grammar
- No fluff/filler
- Direct technical info only
- Commit msgs: terse

## Plans
- End w/ unresolved questions (if any)
- Questions: ultra-concise

## Code Style
- Backend: type hints (strict OFF, but type where possible)
- Frontend: TypeScript strict mode
- Max 100 chars/line
- Descriptive names > comments
- No magic numbers → constants

## Before Coding
1. Clarify ambiguous requirements
2. Check existing patterns
3. Read relevant service/model files
4. Consider edge cases

## File Organization
- All `.md` files → `/docs` folder