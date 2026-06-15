import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create middleware mocks
const createMockMiddleware = () => vi.fn(() => (next: any) => (action: any) => next(action));

// Mock all the slices before importing store
vi.mock('@/services/skills', () => ({
  SkillsSlice: {
    reducerPath: 'SkillsSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/credentials', () => ({
  CredentialsSlice: {
    reducerPath: 'CredentialsSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/perlearner', () => ({
  PerLearnerSlice: {
    reducerPath: 'PerLearnerSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/courses', () => ({
  CoursesSlice: {
    reducerPath: 'CoursesSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/users', () => ({
  UserMetaDataSlice: {
    reducerPath: 'UserMetaDataSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/platform', () => ({
  PlatformSlice: {
    reducerPath: 'PlatformSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/course-metadata', () => ({
  CourseMetadataSlice: {
    reducerPath: 'CourseMetadataSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/catalog', () => ({
  CatalogSlice: {
    reducerPath: 'CatalogSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/career', () => ({
  CareerSlice: {
    reducerPath: 'CareerSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/notifications', () => ({
  NotificationsSlice: {
    reducerPath: 'NotificationsSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/edx-sso', () => ({
  EdxSSOSlice: {
    reducerPath: 'EdxSSOSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/services/core', () => ({
  CoreSlice: {
    reducerPath: 'CoreSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@/features/rbac', () => ({
  rbacSlice: {
    reducerPath: 'rbacSlice',
    reducer: (state = {}) => state,
  },
}));

vi.mock('@/services/studio', () => ({
  StudioSlice: {
    reducerPath: 'StudioSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

vi.mock('@iblai/iblai-js/data-layer', () => ({
  skillsMiddleware: [createMockMiddleware()],
  skillsReducer: { skillsData: (state = {}) => state },
  authApiSlice: {
    reducerPath: 'authApiSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
  auditLogsApiSlice: {
    reducerPath: 'auditLogsApiSlice',
    reducer: (state = {}) => state,
    middleware: createMockMiddleware(),
  },
}));

describe('store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to ensure fresh imports
    vi.resetModules();
  });

  it('exports store configuration', async () => {
    const { store } = await import('../store');
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    expect(store.dispatch).toBeDefined();
  });

  it('has correct reducers configured', async () => {
    const { store } = await import('../store');
    const state = store.getState();

    // Verify reducer paths exist in state
    expect(state).toHaveProperty('SkillsSlice');
    expect(state).toHaveProperty('CredentialsSlice');
    expect(state).toHaveProperty('PerLearnerSlice');
    expect(state).toHaveProperty('CoursesSlice');
    expect(state).toHaveProperty('UserMetaDataSlice');
    expect(state).toHaveProperty('PlatformSlice');
    expect(state).toHaveProperty('CourseMetadataSlice');
    expect(state).toHaveProperty('CatalogSlice');
    expect(state).toHaveProperty('CareerSlice');
    expect(state).toHaveProperty('NotificationsSlice');
    expect(state).toHaveProperty('EdxSSOSlice');
    expect(state).toHaveProperty('CoreSlice');
    expect(state).toHaveProperty('rbacSlice');
    expect(state).toHaveProperty('StudioSlice');
    expect(state).toHaveProperty('auditLogsApiSlice');
  });

  it('includes skillsReducer from data-layer', async () => {
    const { store } = await import('../store');
    const state = store.getState();

    // Verify skillsReducer is included (from data-layer mock)
    expect(state).toHaveProperty('skillsData');
  });

  it('exports RootState type', async () => {
    // This test verifies that the module exports correctly
    // Type checking happens at compile time
    const storeModule = await import('../store');
    expect(storeModule).toHaveProperty('store');
  });

  it('exports AppDispatch type', async () => {
    // This test verifies that the module exports correctly
    const storeModule = await import('../store');
    expect(storeModule).toHaveProperty('store');
    expect(storeModule.store.dispatch).toBeDefined();
  });

  it('can dispatch actions', async () => {
    const { store } = await import('../store');

    // Test that dispatch works
    const testAction = { type: 'TEST_ACTION' };
    expect(() => store.dispatch(testAction)).not.toThrow();
  });

  it('can subscribe to store changes', async () => {
    const { store } = await import('../store');
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    expect(typeof unsubscribe).toBe('function');

    // Dispatch an action to trigger the listener
    store.dispatch({ type: 'TEST_ACTION' });
    expect(listener).toHaveBeenCalled();

    // Cleanup
    unsubscribe();
  });

  it('middleware is correctly configured', async () => {
    // Import the store which triggers middleware configuration
    const { store } = await import('../store');

    // The store should be properly configured with middleware
    expect(store).toBeDefined();

    // Dispatch an action - middleware should be invoked
    const action = { type: 'middleware/test' };
    store.dispatch(action);

    // If middleware is configured correctly, dispatch should work without errors
    expect(store.getState()).toBeDefined();
  });
});
