//
//  Authentication.swift
//  memri
//
//  Created by Ruben Daniels on 7/26/20.
//  Copyright © 2020 memri. All rights reserved.
//


//import {DatabaseController} from "../storage/DatabaseController";

import {DatabaseController} from "../storage/DatabaseController";
import {me} from "../gui/util";
import {CacheMemri} from "../model/Cache";

export class Authentication {
    autologin = true

    isOwnerAuthenticated: boolean = false;

    get hasSecureEnclave() {
        return !this.isSimulator && this.hasBiometrics
    }

    get isSimulator() {
        return true //TARGET_OS_SIMULATOR == 1 //TODO: need to change!
    }

    get hasBiometrics() { //TODO:
        /*//Local Authentication Context
                let localAuthContext = LAContext()
                var error: NSError?

                    /// Policies can have certain requirements which, when not satisfied, would always cause
                    /// the policy evaluation to fail - e.g. a passcode set, a fingerprint
                    /// enrolled with Touch ID or a face set up with Face ID. This method allows easy checking
                    /// for such conditions.
                    let isValidPolicy = localAuthContext.canEvaluatePolicy(
                        .deviceOwnerAuthenticationWithBiometrics, error: &error)

                guard isValidPolicy == true else {
                    if #available(iOS 11, *) {
                        return error!.code != LAError.biometryNotAvailable.rawValue
                    }
                else {
                        return error!.code != LAError.touchIDNotAvailable.rawValue
                    }
                }

                return isValidPolicy*/
        return false;
    }

    RootKeyTag = "memriPrivateKey"

    getErrorDescription(errorCode) {
        switch (errorCode) {
            /*case LAError.authenticationFailed.rawValue:
            return "Authentication was not successful, because user failed to provide valid credentials."
            case LAError.appCancel.rawValue:
            return "Authentication was canceled by application (e.g. invalidate was called while authentication was in progress)."
            case LAError.invalidContext.rawValue:
            return "LAContext passed to this call has been previously invalidated."
            case LAError.notInteractive.rawValue:
            return "Authentication failed, because it would require showing UI which has been forbidden by using interactionNotAllowed property."
            case LAError.passcodeNotSet.rawValue:
            return "Authentication could not start, because passcode is not set on the device."
            case LAError.systemCancel.rawValue:
            return "Authentication was canceled by system (e.g. another application went to foreground)."
            case LAError.userCancel.rawValue:
            return "Authentication was canceled by user (e.g. tapped Cancel button)."
            case LAError.userFallback.rawValue:
            return "Authentication was canceled, because the user tapped the fallback button (Enter Password)."*/
            default:
                return "Error code \(errorCode) not found"
        }
    }

    authenticateOwnerByPasscode(callback) {
        //#if targetEnvironment(simulator)
        if (/*DatabaseController.realmTesting ||*/ this.autologin) {
            this.isOwnerAuthenticated = true
            callback(undefined)
            return;
        }

        this.authenticateOwner(callback)
        return;
        //#endif

        //TODO: need some research
        /*let query: NSDictionary = {
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: "PasscodeAuthentication",
            kSecUseOperationPrompt: "Sign in"
        }

        var typeRef: CFTypeRef;

        let status: OSStatus = SecItemCopyMatching(query, typeRef) //This will prompt the passcode.

        if (status == errSecSuccess) {
            callback(nil)
        } else {
            callback("Authentication failed")
        }*/
    }

    authenticateOwner(callback) {
        //#if targetEnvironment(simulator)
        if (/*DatabaseController.realmTesting || */this.autologin) {
            this.isOwnerAuthenticated = true
            callback(undefined)
            return
        }
        //#endif

        //TODO: need some research
        /*
        let localAuthenticationContext = LAContext()
        localAuthenticationContext.localizedFallbackTitle = "Please use your Passcode"

        var authorizationError: NSError?
            let reason = "Authentication is required for you to continue"
        if localAuthenticationContext.canEvaluatePolicy(
            LAPolicy.deviceOwnerAuthenticationWithBiometrics,
            error: &authorizationError
        ) {
        //            let biometricType = localAuthenticationContext.biometryType == LABiometryType.faceID
        //                ? "Face ID"
        //                : "Touch ID"

            localAuthenticationContext.evaluatePolicy (
                LAPolicy.deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
        ) { (success, evaluationError) in

                if success {
                    isOwnerAuthenticated = true

                    callback(nil)
                } else {
                    #warning("Log all errors in the database — how?? At next successful login")
        //                    if let errorObj = evaluationError {
        //                        let messageToDisplay = self.getErrorDescription(errorCode: errorObj._code)
        //                        print(messageToDisplay)
        //                    }

                    callback(evaluationError)
                }
            }

        } else {
            localAuthenticationContext.evaluatePolicy (
                LAPolicy.deviceOwnerAuthentication,
                localizedReason: reason
        ) { (success, evaluationError) in

                if success {
                    isOwnerAuthenticated = true

                    callback(nil)
                } else {
                    #warning("Log all errors in the database — how?? At next successful login")
        //                    if let errorObj = evaluationError {
        //                        let messageToDisplay = self.getErrorDescription(errorCode: errorObj._code)
        //                        print(messageToDisplay)
        //                    }

                    callback(evaluationError)
                }
            }
        }*/
    }

    static setOwnerAndDBKey(privateKey: string, publicKey: string, dbKey: string) {
        DatabaseController.tryCurrent(true, (realm) => {
            realm.objects("CryptoKey").filtered("name = 'memriDBKey'").forEach((key) => {
                key.active = false
            });

            realm.objects("CryptoKey").filtered("name = 'memriOwnerKey'").forEach((key) => {
                key.active = false
            })

            let myself = me()
            if (!myself.realm) {
                throw "Could not find a reference to 'me'"
            }

            let dbKeyItem = CacheMemri.createItem("CryptoKey", {
                "itemType": "64CharacterRandomHex",
                "key": dbKey,
                "name": "Memri Database Key",
                "active": true
            })
            dbKeyItem.link(myself, "owner");

            let ownerPrivateKeyItem = CacheMemri.createItem("CryptoKey", {
                "itemType": "ED25519",
                "role": "private",
                "key": privateKey,
                "name": "Memri Owner Key",
                "active": true
            })
            let ownerPublicKeyItem = CacheMemri.createItem("CryptoKey", {
                "itemType": "ED25519",
                "role": "public",
                "key": publicKey,
                "name": "Memri Owner Key",
                "active": true
            })
            ownerPrivateKeyItem.link(myself, "owner")
            ownerPublicKeyItem.link(myself, "owner")
            ownerPrivateKeyItem.link(ownerPublicKeyItem, "publicKey")
            ownerPublicKeyItem.link(ownerPrivateKeyItem, "privateKey")
        })
    }

    static async getOwnerAndDBKey(callback) {
        callback(null, localStorage.ownerKey, localStorage.databaseKey)
        /*DatabaseController.current(false,(realm) => {
            let dbQuery = "name = 'memriDBKey' and active = true";
            let dbKey = realm.objects("CryptoKey").filtered(dbQuery)[0];
            if (!dbKey) {
                callback("Database key is not set", undefined, undefined)
                return
            }

            let query = "name = 'memriOwnerKey' and role = 'public' and active = true"
            let ownerKey = realm.objects("CryptoKey").filtered(query)[0];
            if (!dbKey) {
                callback("Owner key is not set", undefined, undefined)
                return
            }

            callback(null, ownerKey.key, dbKey.key)
        })*/
    }
}

