//
//  Authentication.swift
//  memri
//
//  Created by Ruben Daniels on 7/26/20.
//  Copyright © 2020 memri. All rights reserved.
//


export class Authentication {
    static async getOwnerAndDBKey(callback) {
        
        callback(null, localStorage.ownerKey, localStorage.databaseKey)
        /*DatabaseController.current { realm in
            let dbQuery = "name = 'memriDBKey' and active = true"
            guard let dbKey = realm.objects(CryptoKey.self).filter(dbQuery).first else {
                callback("Database key is not set", nil, nil)
                return
            }
            
            let query = "name = 'memriOwnerKey' and role = 'public' and active = true"
            guard let ownerKey = realm.objects(CryptoKey.self).filter(query).first else {
                callback("Owner key is not set", nil, nil)
                return
            }
            
            callback(nil, ownerKey.key, dbKey.key)
        }*/
    }
}

