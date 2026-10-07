import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('Firestore Security Rules — Isolamento por UID e Validação de Corridas e Gastos', () => {
  const rulesPath = path.resolve(__dirname, 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  it('Enforces rules_version = 2 and global default-deny catch-all', () => {
    expect(rulesContent).toContain("rules_version = '2';");
    expect(rulesContent).toContain('match /{document=**} {\n      allow read, write: if false;\n    }');
  });

  it('Enforces strict owner UID isolation (request.auth.uid == uid) across all collections', () => {
    expect(rulesContent).toContain('function isSignedIn()');
    expect(rulesContent).toContain('return request.auth != null;');
    expect(rulesContent).toContain('function isOwner(uid)');
    expect(rulesContent).toContain('return isSignedIn() && request.auth.uid == uid;');
    expect(rulesContent).toContain('existing().uid == request.auth.uid');
  });

  it('Validates Ride and Expense schemas with positive values and allowed payment methods', () => {
    expect(rulesContent).toContain('data.amountCents is int && data.amountCents > 0');
    expect(rulesContent).toContain("data.formaPagamento in ['Dinheiro', 'Pix', 'Cartão']");
    expect(rulesContent).toContain('isValidRide(incoming(), uid)');
    expect(rulesContent).toContain('isValidExpense(incoming(), uid)');
  });
});
