import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  updatePassword,
  deleteDoc
} from '../lib/firebase';
import { User, UserRole } from '../types';
import { seedDatabaseIfEmpty, logSistema } from '../services/firestoreService';

interface AuthContextType {
  user: User | null; // Keep for compatibility
  userProfile: User | null;
  currentUser: any;
  isAdmin: boolean;
  isColaborador: boolean;
  isCidadao: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    cpf: string;
    address: string;
    phone: string;
    nis: string;
    motherName?: string;
    fatherName?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<string>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isAuthenticatingRef = useRef(false);

  // Initialize and seed Firebase on boot, and check/create default admin if none exists
  useEffect(() => {
    const initializeFirebase = async () => {
      await seedDatabaseIfEmpty();
      
      // Ensure specific default user profiles exist in the Firestore 'usuarios' collection
      const defaultUsersToSeed = [
        {
          id: "admin_semps_gov_br",
          email: "admin@semps.gov.br",
          nome: "Administrador Geral SEMPS",
          cpf: "000.000.000-00",
          telefone: "(71) 3633-1111",
          tipo_usuario: "administrador",
          ativo: true,
          foto_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: "SEMPS Centro",
          nis: "00000000000"
        },
        {
          id: "colaborador_semps_gov_br",
          email: "colaborador@semps.gov.br",
          nome: "Colaborador SEMPS",
          cpf: "111.222.333-44",
          telefone: "(71) 3633-2222",
          tipo_usuario: "colaborador",
          ativo: true,
          foto_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: "SEMPS Centro",
          nis: "11122233344"
        },
        {
          id: "maria_gmail_com",
          email: "maria@gmail.com",
          nome: "Maria das Graças Souza",
          cpf: "123.456.789-00",
          telefone: "(71) 98888-2222",
          tipo_usuario: "cidadao",
          ativo: true,
          foto_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: "Rua Direta de Mar Grande, nº 120 - Vera Cruz/BA",
          nis: "12345678901",
          motherName: "Francisca das Graças",
          fatherName: "Antônio de Souza"
        }
      ];

      for (const u of defaultUsersToSeed) {
        try {
          const docRef = doc(db, "usuarios", u.id);
          const docSnap = await getDoc(docRef);
          
          let existsInDb = docSnap.exists();
          
          if (!existsInDb) {
            try {
              const q = query(collection(db, "usuarios"), where("email", "==", u.email));
              const querySnap = await getDocs(q);
              existsInDb = !querySnap.empty;
            } catch (queryErr) {
              // Ignore query permission errors
            }
          }

          if (!existsInDb) {
            console.log(`[Auth] Creating initial user profile for ${u.email} in Firestore`);
            await setDoc(docRef, u);
          }
        } catch (err) {
          console.warn(`[Auth] Could not initialize user profile for ${u.email}:`, err);
        }
      }

      try {
        const qAdmin = query(collection(db, "usuarios"), where("tipo_usuario", "==", "administrador"));
        const qAdminSnap = await getDocs(qAdmin);
        if (qAdminSnap.empty) {
          console.log("[Auth] Checking alternate admin roles...");
          const qAdminAlt = query(collection(db, "usuarios"), where("tipo_usuario", "==", "admin"));
          const qAdminAltSnap = await getDocs(qAdminAlt);
          
          if (qAdminAltSnap.empty) {
            console.log("[Auth] No administrator exists. Creating default administrator in Firebase Auth and Firestore...");
            if (!auth.currentUser) {
              try {
                const cred = await createUserWithEmailAndPassword(auth, 'admin@sempsvc.gov.br', 'Admin@123456');
                await setDoc(doc(db, "usuarios", cred.user.uid), {
                  uid: cred.user.uid,
                  nome: "Administrador SEMPS VC",
                  cpf: "000.000.000-00",
                  telefone: "(71) 3633-1111",
                  email: "admin@sempsvc.gov.br",
                  tipo_usuario: "administrador",
                  ativo: true,
                  foto_url: "",
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  needsPasswordChange: true, // forced password change
                  address: "SEMPS Sede - Vera Cruz/BA",
                  nis: "00000000000"
                });
                await logSistema("registro_administrador", "Criado administrador padrão automático do sistema", cred.user.uid);
                await signOut(auth); // Sign out immediately to leave clean state
              } catch (authErr: any) {
                if (authErr.code === 'auth/email-already-in-use') {
                  console.log("[Auth] Admin account already exists in Firebase Auth.");
                } else {
                  console.error("[Auth] Error registering default administrator:", authErr);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("[Auth] Could not check existing administrators on boot (this is expected for unauthenticated or non-admin users due to security rules).");
      }
    };
    initializeFirebase();
  }, []);

  // Sync auth state with Firestore user details
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (isAuthenticatingRef.current) {
        console.log("[Auth] onAuthStateChanged ignored state update because manual login/register is in progress.");
        return;
      }
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "usuarios", firebaseUser.uid);
          let userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            const email = firebaseUser.email?.toLowerCase();
            
            // Check if there is a deterministic seed profile that we can migrate/use
            let deterministicId = "";
            if (email === 'admin@semps.gov.br') {
              deterministicId = "admin_semps_gov_br";
            } else if (email === 'colaborador@semps.gov.br') {
              deterministicId = "colaborador_semps_gov_br";
            } else if (email === 'maria@gmail.com') {
              deterministicId = "maria_gmail_com";
            }

            let seededData: any = null;
            if (deterministicId) {
              try {
                const detDocRef = doc(db, "usuarios", deterministicId);
                const detDocSnap = await getDoc(detDocRef);
                if (detDocSnap.exists()) {
                  seededData = detDocSnap.data();
                  try {
                    await deleteDoc(detDocRef);
                    console.log(`[Auth] Cleaned up deterministic profile ${deterministicId}`);
                  } catch (deleteErr) {
                    console.warn(`[Auth] Could not delete deterministic profile ${deterministicId}:`, deleteErr);
                  }
                }
              } catch (detErr) {
                console.warn("[Auth] Failed to check deterministic seed document:", detErr);
              }
            }

            if (email === 'admin@semps.gov.br' || email === 'admin@sempsvc.gov.br') {
              console.log("[Auth] Re-provisioning missing admin profile in Firestore on auth state sync");
              await setDoc(userDocRef, {
                uid: firebaseUser.uid,
                nome: seededData?.nome || (email === 'admin@sempsvc.gov.br' ? "Administrador SEMPS VC" : "Administrador Geral SEMPS"),
                cpf: seededData?.cpf || "000.000.000-00",
                telefone: seededData?.telefone || "(71) 3633-1111",
                email: email,
                tipo_usuario: "administrador",
                ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                foto_url: seededData?.foto_url || "",
                created_at: seededData?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                address: seededData?.address || (email === 'admin@sempsvc.gov.br' ? "SEMPS Sede - Vera Cruz/BA" : "SEMPS Centro"),
                nis: seededData?.nis || "00000000000",
                needsPasswordChange: email === 'admin@sempsvc.gov.br'
              });
              userSnap = await getDoc(userDocRef);
            } else if (email === 'colaborador@semps.gov.br') {
              console.log("[Auth] Re-provisioning missing collaborator profile in Firestore on auth state sync");
              await setDoc(userDocRef, {
                uid: firebaseUser.uid,
                nome: seededData?.nome || "Colaborador SEMPS",
                cpf: seededData?.cpf || "111.222.333-44",
                telefone: seededData?.telefone || "(71) 3633-2222",
                email: email,
                tipo_usuario: "colaborador",
                ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                foto_url: seededData?.foto_url || "",
                created_at: seededData?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                address: seededData?.address || "SEMPS Centro",
                nis: seededData?.nis || "11122233344"
              });
              userSnap = await getDoc(userDocRef);
            } else if (email === 'maria@gmail.com') {
              console.log("[Auth] Re-provisioning missing Maria profile in Firestore on auth state sync");
              await setDoc(userDocRef, {
                uid: firebaseUser.uid,
                nome: seededData?.nome || "Maria das Graças Souza",
                cpf: seededData?.cpf || "123.456.789-00",
                telefone: seededData?.telefone || "(71) 98888-2222",
                email: email,
                tipo_usuario: "cidadao",
                ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                foto_url: seededData?.foto_url || "",
                created_at: seededData?.created_at || new Date().toISOString(),
                updated_at: new Date().toISOString(),
                address: seededData?.address || "Rua Direta de Mar Grande, nº 120 - Vera Cruz/BA",
                nis: seededData?.nis || "12345678901",
                motherName: seededData?.motherName || "Francisca das Graças",
                fatherName: seededData?.fatherName || "Antônio de Souza"
              });
              userSnap = await getDoc(userDocRef);
            }
          }

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUser({
              id: data.uid || firebaseUser.uid,
              email: data.email || firebaseUser.email || "",
              name: data.nome || data.name || "",
              cpf: data.cpf || "",
              address: data.address || "",
              phone: data.telefone || data.phone || "",
              nis: data.nis || "",
              motherName: data.motherName || "",
              fatherName: data.fatherName || "",
              role: (data.tipo_usuario || data.role || 'cidadao') as UserRole,
              createdAt: data.created_at || data.createdAt || new Date().toISOString(),
              needsPasswordChange: data.needsPasswordChange || false
            });
          } else {
            // Profile document doesn't exist, we fallback or wait for registration
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Cidadão",
              cpf: "",
              address: "",
              phone: "",
              nis: "",
              role: 'cidadao',
              createdAt: new Date().toISOString(),
              needsPasswordChange: false
            });
          }
        } catch (err) {
          console.error("Erro ao sincronizar dados de perfil do Firestore:", err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login handler
  const login = async (email: string, password: string): Promise<User> => {
    isAuthenticatingRef.current = true;
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    try {
      const isSeedEmail = cleanEmail === 'admin@sempsvc.gov.br' || 
                          cleanEmail === 'admin@semps.gov.br' || 
                          cleanEmail === 'colaborador@semps.gov.br' || 
                          cleanEmail === 'maria@gmail.com';

      if (isSeedEmail) {
        try {
          // Attempt to sign in first with whatever password was provided
          await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        } catch (err: any) {
          // If login fails because user doesn't exist, we auto-provision them on the fly!
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
              console.log(`[Auth] Seed email ${cleanEmail} failed login. Trying to auto-register it...`);
              const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
              
              // Try to fetch any deterministic seed profile stored in Firestore to migrate/clean up
              let deterministicId = "";
              if (cleanEmail === 'admin@semps.gov.br') {
                deterministicId = "admin_semps_gov_br";
              } else if (cleanEmail === 'colaborador@semps.gov.br') {
                deterministicId = "colaborador_semps_gov_br";
              } else if (cleanEmail === 'maria@gmail.com') {
                deterministicId = "maria_gmail_com";
              }

              let seededData: any = null;
              if (deterministicId) {
                try {
                  const detDocRef = doc(db, "usuarios", deterministicId);
                  const detDocSnap = await getDoc(detDocRef);
                  if (detDocSnap.exists()) {
                    seededData = detDocSnap.data();
                    try {
                      await deleteDoc(detDocRef);
                      console.log(`[Auth] Cleaned up deterministic profile ${deterministicId}`);
                    } catch (deleteErr) {
                      console.warn(`[Auth] Could not delete deterministic profile ${deterministicId}:`, deleteErr);
                    }
                  }
                } catch (detErr) {
                  console.warn("[Auth] Failed to check deterministic seed document:", detErr);
                }
              }

              // Create the user profile in Firestore using their new real Firebase UID
              let profileData: any = {};
              if (cleanEmail === 'admin@sempsvc.gov.br') {
                profileData = {
                  uid: cred.user.uid,
                  nome: seededData?.nome || "Administrador SEMPS VC",
                  cpf: seededData?.cpf || "000.000.000-00",
                  telefone: seededData?.telefone || "(71) 3633-1111",
                  email: cleanEmail,
                  tipo_usuario: "administrador",
                  ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                  foto_url: seededData?.foto_url || "",
                  created_at: seededData?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: seededData?.address || "SEMPS Sede - Vera Cruz/BA",
                  nis: seededData?.nis || "00000000000",
                  needsPasswordChange: true
                };
              } else if (cleanEmail === 'admin@semps.gov.br') {
                profileData = {
                  uid: cred.user.uid,
                  nome: seededData?.nome || "Administrador Geral SEMPS",
                  cpf: seededData?.cpf || "000.000.000-00",
                  telefone: seededData?.telefone || "(71) 3633-1111",
                  email: cleanEmail,
                  tipo_usuario: "administrador",
                  ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                  foto_url: seededData?.foto_url || "",
                  created_at: seededData?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: seededData?.address || "SEMPS Centro",
                  nis: seededData?.nis || "00000000000"
                };
              } else if (cleanEmail === 'colaborador@semps.gov.br') {
                profileData = {
                  uid: cred.user.uid,
                  nome: seededData?.nome || "Colaborador SEMPS",
                  cpf: seededData?.cpf || "111.222.333-44",
                  telefone: seededData?.telefone || "(71) 3633-2222",
                  email: cleanEmail,
                  tipo_usuario: "colaborador",
                  ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                  foto_url: seededData?.foto_url || "",
                  created_at: seededData?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: seededData?.address || "SEMPS Centro",
                  nis: seededData?.nis || "11122233344"
                };
              } else if (cleanEmail === 'maria@gmail.com') {
                profileData = {
                  uid: cred.user.uid,
                  nome: seededData?.nome || "Maria das Graças Souza",
                  cpf: seededData?.cpf || "123.456.789-00",
                  telefone: seededData?.telefone || "(71) 98888-2222",
                  email: cleanEmail,
                  tipo_usuario: "cidadao",
                  ativo: seededData?.ativo !== undefined ? seededData.ativo : true,
                  foto_url: seededData?.foto_url || "",
                  created_at: seededData?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: seededData?.address || "Rua Direta de Mar Grande, nº 120 - Vera Cruz/BA",
                  nis: seededData?.nis || "12345678901",
                  motherName: seededData?.motherName || "Francisca das Graças",
                  fatherName: seededData?.fatherName || "Antônio de Souza"
                };
              }

              await setDoc(doc(db, "usuarios", cred.user.uid), profileData);
              await logSistema("registro_automatico", `Criado perfil automático de seed para ${cleanEmail}`, cred.user.uid);
              console.log(`[Auth] Successfully registered and initialized Firestore profile for ${cleanEmail}`);
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                // If it already exists in Firebase Auth but they got the password wrong:
                let hintMsg = "E-mail ou senha incorretos.";
                if (cleanEmail === 'admin@semps.gov.br') {
                  hintMsg = "Senha incorreta. Para admin@semps.gov.br use a senha padrão: adminpassword123";
                } else if (cleanEmail === 'colaborador@semps.gov.br') {
                  hintMsg = "Senha incorreta. Para colaborador@semps.gov.br use a senha padrão: adminpassword123";
                } else if (cleanEmail === 'maria@gmail.com') {
                  hintMsg = "Senha incorreta. Para maria@gmail.com use a senha padrão: maria123password";
                } else if (cleanEmail === 'admin@sempsvc.gov.br') {
                  hintMsg = "Senha incorreta. Para admin@sempsvc.gov.br use a senha padrão: Admin@123456";
                }
                throw new Error(hintMsg);
              } else {
                throw createErr;
              }
            }
          } else {
            throw err;
          }
        }
      }

      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          const usersRef = collection(db, "usuarios");
          const q = query(usersRef, where("email", "==", cleanEmail));
          const querySnap = await getDocs(q);
          
          if (!querySnap.empty) {
            const userDoc = querySnap.docs[0];
            const userData = userDoc.data();
            
            if (userData.password === cleanPassword || userData.senha_temporaria === cleanPassword) {
              console.log(`[Auth] User ${cleanEmail} registered by Admin found. Auto-provisioning Firebase Auth account...`);
              credential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
              
              const oldDocRef = userDoc.ref;
              const newDocRef = doc(db, "usuarios", credential.user.uid);
              
              const updatedProfile = {
                ...userData,
                uid: credential.user.uid,
                updated_at: new Date().toISOString()
              };
              
              await setDoc(newDocRef, updatedProfile);
              if (oldDocRef.id !== credential.user.uid) {
                await deleteDoc(oldDocRef);
              }
              console.log(`[Auth] User ${cleanEmail} successfully provisioned.`);
            } else {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      const userDocRef = doc(db, "usuarios", credential.user.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const loggedInUser: User = {
          id: credential.user.uid,
          email: data.email || credential.user.email || "",
          name: data.nome || data.name || "",
          cpf: data.cpf || "",
          address: data.address || "",
          phone: data.telefone || data.phone || "",
          nis: data.nis || "",
          motherName: data.motherName || "",
          fatherName: data.fatherName || "",
          role: (data.tipo_usuario || data.role || 'cidadao') as UserRole,
          createdAt: data.created_at || data.createdAt || new Date().toISOString(),
          needsPasswordChange: data.needsPasswordChange || false
        };
        setUser(loggedInUser);
        await logSistema("login", `Usuário ${email} efetuou login com sucesso`, credential.user.uid);
        return loggedInUser;
      } else {
        const fallbackUser: User = {
          id: credential.user.uid,
          email: credential.user.email || "",
          name: credential.user.displayName || email.split('@')[0],
          cpf: "",
          address: "",
          phone: "",
          nis: "",
          role: "cidadao",
          createdAt: new Date().toISOString(),
          needsPasswordChange: false
        };
        setUser(fallbackUser);
        await logSistema("login", `Usuário ${email} efetuou login (sem documento de perfil) com sucesso`, credential.user.uid);
        return fallbackUser;
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let errMsg = "Erro ao fazer login. Verifique suas credenciais.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errMsg = "E-mail ou senha incorretos.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "E-mail informado é inválido.";
      }
      throw new Error(errMsg);
    } finally {
      setLoading(false);
      isAuthenticatingRef.current = false;
    }
  };

  // Register handler
  const register = async (data: {
    email: string;
    password: string;
    name: string;
    cpf: string;
    address: string;
    phone: string;
    nis: string;
    motherName?: string;
    fatherName?: string;
  }): Promise<User> => {
    isAuthenticatingRef.current = true;
    setLoading(true);
    try {
      // Check duplicate CPF in Firestore (since Auth registers by email, we must prevent duplicate CPF)
      const usersRef = collection(db, "usuarios");
      const q = query(usersRef, where("cpf", "==", data.cpf));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        throw new Error("Este CPF já está cadastrado no sistema.");
      }

      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Save user profile details in Firestore
      const userProfile = {
        uid: credential.user.uid,
        nome: data.name,
        cpf: data.cpf,
        telefone: data.phone,
        email: data.email.toLowerCase(),
        tipo_usuario: "cidadao", // Default role
        ativo: true,
        foto_url: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        needsPasswordChange: false,
        // Supplementary fields for absolute UI compatibility
        address: data.address,
        nis: data.nis,
        motherName: data.motherName || "",
        fatherName: data.fatherName || ""
      };

      await setDoc(doc(db, "usuarios", credential.user.uid), userProfile);

      const registeredUser: User = {
        id: credential.user.uid,
        email: data.email.toLowerCase(),
        name: data.name,
        cpf: data.cpf,
        address: data.address,
        phone: data.phone,
        nis: data.nis,
        motherName: data.motherName || "",
        fatherName: data.fatherName || "",
        role: "cidadao",
        createdAt: userProfile.created_at,
        needsPasswordChange: false
      };

      setUser(registeredUser);
      await logSistema("registro_usuario", `Usuário cadastrado com sucesso com CPF ${data.cpf}`, credential.user.uid);
      return registeredUser;
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.message && err.message.includes("CPF")) {
        throw err;
      }
      let errMsg = "Erro ao realizar cadastro.";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "Este endereço de e-mail já está cadastrado.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "A senha deve ter pelo menos 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "O e-mail informado é inválido.";
      }
      throw new Error(errMsg);
    } finally {
      setLoading(false);
      isAuthenticatingRef.current = false;
    }
  };

  // Logout handler
  const logout = async () => {
    isAuthenticatingRef.current = true;
    setLoading(true);
    try {
      if (auth.currentUser) {
        await logSistema("logout", "Usuário efetuou logout", auth.currentUser.uid);
      }
      await signOut(auth);
      setUser(null);
    } finally {
      setLoading(false);
      isAuthenticatingRef.current = false;
    }
  };

  // Recover password handler
  const recoverPassword = async (email: string): Promise<string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return `Um e-mail de recuperação de senha foi enviado para ${email}. Verifique sua caixa de entrada.`;
    } catch (err: any) {
      console.error("Password recovery error:", err);
      if (err.code === "auth/user-not-found") {
        return "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação.";
      }
      throw new Error("Erro ao solicitar recuperação de senha.");
    }
  };

  // Change password handler
  const changePassword = async (newPassword: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("Usuário não autenticado.");
    try {
      await updatePassword(auth.currentUser, newPassword);
      
      const userDocRef = doc(db, "usuarios", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        needsPasswordChange: false,
        updated_at: new Date().toISOString()
      });
      
      if (user) {
        setUser({
          ...user,
          needsPasswordChange: false
        });
      }
      
      await logSistema("troca_senha", "Usuário alterou a senha padrão no primeiro acesso", auth.currentUser.uid);
    } catch (err: any) {
      console.error("Change password error:", err);
      throw new Error(err.message || "Erro ao alterar a senha.");
    }
  };

  const isAdmin = user ? (user.role === 'administrador' || user.role === 'admin') : false;
  const isColaborador = user ? (user.role === 'colaborador') : false;
  const isCidadao = user ? (user.role === 'cidadao' || user.role === 'citizen') : false;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile: user,
      currentUser: auth.currentUser,
      isAdmin,
      isColaborador,
      isCidadao,
      loading, 
      login, 
      register, 
      logout, 
      recoverPassword, 
      changePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
