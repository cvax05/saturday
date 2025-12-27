
// Using built-in fetch for Node 20+
const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
    console.log('🚀 Starting Local Installation Verification...');

    // 1. Health Check / Basic Connectivity
    try {
        const healthRes = await fetch(`http://localhost:3000/`);
        if (healthRes.status === 200) {
            console.log('✅ Frontend server is reachable');
        } else {
            console.error('❌ Frontend server returned status:', healthRes.status);
        }
    } catch (e) {
        console.error('❌ Could not reach server. Is it running?');
        process.exit(1);
    }

    // 2. Register/Login Alice
    const aliceEmail = `alice_${Date.now()}@test.com`;
    const password = 'password123';
    let aliceCookie = '';
    let aliceId = '';

    console.log(`\n👤 Registering Alice (${aliceEmail})...`);
    try {
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `alice_${Date.now()}`,
                email: aliceEmail,
                password: password,
                schoolId: 'fbb7eadf-1e88-4284-8c25-0b4a4f5c7244', // Using ID from docs, might need to fetch schools first if dynamic
                displayName: 'Alice Test'
            })
        });

        if (!regRes.ok) {
            // If registration fails, try login (maybe user exists)
            console.log('   Registration failed (might exist), trying login...');
        }

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: aliceEmail, password })
        });

        if (loginRes.ok) {
            const cookie = loginRes.headers.get('set-cookie');
            if (cookie) aliceCookie = cookie;
            const data = await loginRes.json();
            aliceId = data.user.id;
            console.log('✅ Alice logged in successfully');
        } else {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

    } catch (e) {
        console.error('❌ Alice auth failed:', e);
        // Try to continue or exit?
    }

    // 3. Register/Login Bob
    const bobEmail = `bob_${Date.now()}@test.com`;
    let bobCookie = '';
    let bobId = '';

    console.log(`\n👤 Registering Bob (${bobEmail})...`);
    try {
        // Similar logic for Bob...
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `bob_${Date.now()}`,
                email: bobEmail,
                password: password,
                schoolId: 'fbb7eadf-1e88-4284-8c25-0b4a4f5c7244',
                displayName: 'Bob Test'
            })
        });

        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: bobEmail, password })
        });

        if (loginRes.ok) {
            const cookie = loginRes.headers.get('set-cookie');
            if (cookie) bobCookie = cookie;
            const data = await loginRes.json();
            bobId = data.user.id;
            console.log('✅ Bob logged in successfully');
        } else {
            throw new Error(`Login failed: ${loginRes.status}`);
        }
    } catch (e) {
        console.error('❌ Bob auth failed:', e);
    }

    if (!aliceCookie || !bobCookie) {
        console.error('❌ Cannot proceed with messaging tests without both users logged in.');
        return;
    }

    // 4. Create Conversation
    console.log('\n💬 Creating conversation...');
    let conversationId = '';
    try {
        const res = await fetch(`${BASE_URL}/messages/conversations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': aliceCookie
            },
            body: JSON.stringify({ participantIds: [bobId] })
        });

        if (res.ok) {
            const data = await res.json();
            conversationId = data.conversation.id;
            console.log('✅ Conversation created:', conversationId);
        } else {
            throw new Error(`Create conversation failed: ${res.status}`);
        }
    } catch (e) {
        console.error('❌ Conversation creation failed:', e);
        return;
    }

    // 5. Send Message
    console.log('\n📨 Sending message from Alice to Bob...');
    try {
        const res = await fetch(`${BASE_URL}/messages/${conversationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': aliceCookie
            },
            body: JSON.stringify({ content: 'Hello Bob, this is a test!' })
        });

        if (res.ok) {
            console.log('✅ Message sent successfully');
        } else {
            throw new Error(`Send message failed: ${res.status}`);
        }
    } catch (e) {
        console.error('❌ Sending message failed:', e);
    }

    // 6. Verify Receipt (Bob checks messages)
    console.log('\n👀 Bob checking messages...');
    try {
        const res = await fetch(`${BASE_URL}/messages/${conversationId}`, {
            headers: { 'Cookie': bobCookie }
        });

        if (res.ok) {
            const data = await res.json();
            const messages = data.messages;
            if (messages.length > 0 && messages[0].content === 'Hello Bob, this is a test!') {
                console.log('✅ Bob received the message');
            } else {
                console.error('❌ Message not found or content mismatch');
            }
        } else {
            throw new Error(`Get messages failed: ${res.status}`);
        }
    } catch (e) {
        console.error('❌ Checking messages failed:', e);
    }

    console.log('\n🎉 Verification Complete!');
}

runTests();
