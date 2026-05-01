import { beforeEach, describe, expect, it } from 'vitest';
import {
  resolveAccessSync,
  resolveEffectiveAccess,
} from '@/lib/access-control/effectiveAccess';
import type { OrganizationMember, User } from '@/types/organization';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user-1@example.com',
    displayName: 'User One',
    organizationId: 'org-1',
    role: 'viewer',
    status: 'active',
    modulosHabilitados: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildMember(overrides: Partial<OrganizationMember> = {}): OrganizationMember {
  return {
    userId: 'user-1',
    email: 'user-1@example.com',
    displayName: 'User One',
    role: 'viewer',
    status: 'active',
    modulosHabilitados: null,
    invitedBy: 'owner-1',
    joinedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('effectiveAccess', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS = '';
  });

  it('rol owner resuelve a perfil por default esperado por la implementacion real', async () => {
    const access = await resolveEffectiveAccess(
      buildUser({ role: 'owner' }),
      'org-1',
      buildMember({ role: 'owner' }),
      ['contabilidad']
    );

    expect(access.role).toBe('owner');
    expect(access.functionalProfile).toBe('productor_ejecutivo');
  });

  it('rol operator resuelve a perfil operario_campo por default', async () => {
    const access = await resolveEffectiveAccess(
      buildUser({ role: 'operator' }),
      'org-1',
      buildMember({ role: 'operator' }),
      []
    );

    expect(access.role).toBe('operator');
    expect(access.functionalProfile).toBe('operario_campo');
  });

  it('permissionOverrides.deny bloquea canWrite aunque el rol lo permita', () => {
    const permissions = resolveAccessSync(
      'owner',
      undefined,
      { deny: ['canWrite'] },
      ['contabilidad']
    );

    expect(permissions.canWrite).toBe(false);
    expect(permissions.canRead).toBe(true);
  });

  it('resolveAccessSync con plugins vacios deshabilita canViewFinancials aunque el rol lo permita', () => {
    const permissions = resolveAccessSync('owner', undefined, undefined, []);

    expect(permissions.canViewFinancials).toBe(false);
  });
});
