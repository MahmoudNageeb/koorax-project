// PWA Service Worker Registration and Push Notifications

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Check if already subscribed
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('✅ Already subscribed to push notifications');
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

// Request Push Notification Permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Subscribe to Push Notifications
async function subscribeToPush() {
  try {
    const token = localStorage.getItem('koorax_token');
    if (!token) {
      alert('يجب تسجيل الدخول أولاً');
      return false;
    }

    const permission = await requestNotificationPermission();
    if (!permission) {
      alert('يجب السماح بالإشعارات أولاً');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Public VAPID key (you should generate your own)
    const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib37gp2HgXGg8r_QTZe1p-K1BppYGEaGwQnfOE1-1TdIvBLKcCOV8u8Gf3Y';
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Send subscription to server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth'))
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Subscribed to push notifications');
      if (window.showToast) {
        window.showToast('تم تفعيل الإشعارات بنجاح', 'success');
      }
      return true;
    } else {
      throw new Error(data.error);
    }
    
  } catch (error) {
    console.error('❌ Failed to subscribe:', error);
    if (window.showToast) {
      window.showToast('فشل تفعيل الإشعارات', 'error');
    }
    return false;
  }
}

// Unsubscribe from Push Notifications
async function unsubscribeFromPush() {
  try {
    const token = localStorage.getItem('koorax_token');
    if (!token) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      
      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });
      
      console.log('✅ Unsubscribed from push notifications');
      if (window.showToast) {
        window.showToast('تم إلغاء الإشعارات', 'info');
      }
      return true;
    }
    
  } catch (error) {
    console.error('❌ Failed to unsubscribe:', error);
    return false;
  }
}

// Check if subscribed
async function isSubscribed() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

// Utility functions
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Auto-subscribe on login (if permission already granted)
window.addEventListener('koorax:login', async () => {
  if (Notification.permission === 'granted') {
    const subscribed = await isSubscribed();
    if (!subscribed) {
      await subscribeToPush();
    }
  }
});

// Export functions
window.subscribeToPush = subscribeToPush;
window.unsubscribeFromPush = unsubscribeFromPush;
window.isSubscribed = isSubscribed;
