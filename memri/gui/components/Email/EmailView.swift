//
//  EmailView.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import SwiftUI

struct EmailView: UIViewRepresentable {
    var emailHTML: String?
    
    func makeUIView(context: Context) -> EmailViewUIKit {
        EmailViewUIKit()
    }
    
    func updateUIView(_ emailView: EmailViewUIKit, context: Context) {
        emailView.emailHTML = emailHTML
    }
}
