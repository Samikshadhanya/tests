import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppStore } from '../lib/app-store';
import { LogIn, Mail, Lock, User, CheckCircle } from 'lucide-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '345713405310-j4sldt6hcqe6ip243odi7qtq5as4sd4u.apps.googleusercontent.com',
});

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAppStore();

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestRole, setGuestRole] = useState('Family Member');
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // the structure changed in v11+, but we fallback properly
      const idToken = userInfo.data?.idToken || userInfo.idToken; 
      
      if (!idToken) throw new Error('No Google ID Token found');
      
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // The auth observer in app-store.tsx will handle the state and we can route if needed
      // Actually, since app-store handles routing in some cases, we might not need to manually route here, 
      // but let's be safe. Wait, the global observer redirects if user is found. 
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setAuthError(err.message || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  const handleAuthSubmit = async () => {
    setLoading(true);
    setAuthError('');
    try {
      if (isGuestMode) {
        await signIn('guest', '', guestName, guestAge, guestRole, '', false);
        router.replace('/(tabs)');
      } else {
        await signIn('email', email, '', '', '', password, isCreateAccount);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setAuthError('');
    try {
      await signIn('demo');
      router.replace('/(tabs)');
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.logoText}>MedHome</Text>
          </View>
          <Text style={styles.subtitle}>Your family's health, organized.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              {isGuestMode ? 'Guest Setup' : (isCreateAccount ? 'Create account' : 'Sign in')}
            </Text>
            <Text style={styles.formSubtitle}>
              {isGuestMode ? 'Tell us a bit about yourself.' : 'Open your household dashboard.'}
            </Text>

            {isGuestMode ? (
              <View style={styles.inputs}>
                <View style={styles.inputGroup}>
                  <User color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Name (e.g. John Doe)"
                    value={guestName}
                    onChangeText={setGuestName}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <CheckCircle color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Age (e.g. 35)"
                    value={guestAge}
                    onChangeText={setGuestAge}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <CheckCircle color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Role (e.g. Host, Father)"
                    value={guestRole}
                    onChangeText={setGuestRole}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.inputs}>
                <View style={styles.inputGroup}>
                  <Mail color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Lock color="#94a3b8" size={20} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isGuestMode ? 'Enter as Guest' : (isCreateAccount ? 'Create Account' : 'Sign in')}
                </Text>
              )}
            </TouchableOpacity>

            {!isGuestMode && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity 
                  style={[styles.googleButton, loading && styles.disabledButton]} 
                  disabled={loading}
                  onPress={handleGoogleSignIn}
                >
                  <LogIn color="#0f766e" size={20} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Sign In with Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footerLinks}>
              {isGuestMode ? (
                <TouchableOpacity onPress={() => setIsGuestMode(false)}>
                  <Text style={styles.linkText}>Back to login</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setIsCreateAccount(!isCreateAccount)}>
                    <Text style={styles.linkTextTeal}>
                      {isCreateAccount ? 'Sign in instead' : 'Create account'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsGuestMode(true)}>
                    <Text style={styles.linkText}>Continue as guest</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <TouchableOpacity style={styles.demoLink} onPress={handleDemoLogin}>
            <Text style={styles.demoLinkText}>Load pre-filled Demo User data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  iconContainer: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  inputs: {
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    width: '100%',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f766e',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  linkText: {
    color: '#475569',
    fontSize: 14,
  },
  linkTextTeal: {
    color: '#0f766e',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoLink: {
    marginTop: 30,
  },
  demoLinkText: {
    color: '#94a3b8',
    fontSize: 13,
    textDecorationLine: 'underline',
  }
});
