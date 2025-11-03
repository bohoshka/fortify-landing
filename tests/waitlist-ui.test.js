import { test } from 'node:test';
import assert from 'node:assert/strict';

test('waitlist form submits JSON payload to the API', async () => {
  const originalDocument = global.document;
  const originalFetch = global.fetch;
  const originalFormData = global.FormData;

  let submitHandler;
  let formDataCalls = 0;
  const fetchCalls = [];

  const emailInput = { value: 'alice@example.com' };
  const sourceInput = { value: 'join_waitlist' };
  const honeypotInput = { value: '' };
  const submitButton = { disabled: false, textContent: 'Notify me' };
  const statusMessage = { textContent: 'Initial status' };

  const form = {
    action: '/api/waitlist',
    getAttribute(name) {
      if (name === 'data-endpoint') {
        return null;
      }
      if (name === 'action') {
        return '/api/waitlist';
      }
      return null;
    },
    addEventListener(type, handler) {
      if (type === 'submit') {
        submitHandler = handler;
      }
    },
    querySelector(selector) {
      if (selector === 'button') return submitButton;
      if (selector === 'input[name="email"]') return emailInput;
      if (selector === 'input[name="source"]') return sourceInput;
      if (selector === 'input[name="hp"]') return honeypotInput;
      return null;
    },
    resetCalled: false,
    reset() {
      this.resetCalled = true;
      emailInput.value = '';
    },
  };

  const documentStub = {
    addEventListener() {
      // no-op for click listeners in this test
    },
    getElementById(id) {
      if (id === 'waitlist') return form;
      if (id === 'waitlist-status') return statusMessage;
      return null;
    },
  };

  global.document = documentStub;
  global.FormData = class MockFormData {
    constructor() {
      formDataCalls += 1;
    }
  };
  global.fetch = async (url, options = {}) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      json: async () => ({ status: 'ok' }),
    };
  };

  try {
    await import('../js/app.js');
    assert.ok(submitHandler, 'submit handler should be registered');

    await submitHandler({ preventDefault() {} });

    assert.equal(formDataCalls, 0, 'FormData should not be used for JSON submission');
    assert.equal(fetchCalls.length, 1, 'fetch should be called once');
    const [{ url, options }] = fetchCalls;
    assert.equal(url, '/api/waitlist');
    assert.equal(options.method, 'POST');
    assert.ok(options.headers, 'headers must be provided');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.ok(typeof options.body === 'string', 'body should be a JSON string');
    const parsed = JSON.parse(options.body);
    assert.deepEqual(parsed, {
      email: 'alice@example.com',
      source: 'join_waitlist',
      hp: '',
    });
  } finally {
    global.document = originalDocument;
    global.fetch = originalFetch;
    global.FormData = originalFormData;
  }
});
