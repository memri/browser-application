//
//  EmailThreadCell.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI} from "../../swiftUI";
import * as React from "react";

export class EmailThreadItem extends MainUI {
    uuid: string
    contentHTML: string
    headerView: AnyView

    hash(hasher) {
        hasher.combine(this.uuid)
        hasher.combine(this.contentHTML)
    }

    render() {
        this.uuid = this.props.uuid;
        this.contentHTML = this.props.contentHTML;
        this.headerView = this.props.headerView;

        return (
            <div style={this.setStyles()} className={"EmailThreadItem"}>
                <EmailThreadCell uuid={this.uuid} contentHTML={this.contentHTML} headerView={this.headerView}/>
            </div>
        )
    }

    /*static func == (lhs: EmailThreadItem, rhs: EmailThreadItem) -> Bool {
        lhs.uuid == rhs.uuid && lhs.contentHTML == rhs.contentHTML
    }*/
}

export class EmailThreadCell extends MainUI/*: UITableViewCell*/ {
    reuseID = "EmailThreadCell"
    
    emailView /*= new EmailViewUIKit()*/
    
    emailHeaderView /*= new UIHostingController(rootView: AnyView(EmptyView()))*/
    
    setContent(email: EmailThreadItem) {
        this.emailView.emailHTML = email.contentHTML
        this.emailHeaderView.rootView = email.headerView
    }
    
    onEmailContentSizeUpdated() {
        //didSet {
            this.emailView.onSizeUpdated = this.onEmailContentSizeUpdated
        //}
    }

    render() {
        this.init();

        return (
            <div style={this.setStyles()} key={this.props.uuid}>
                {this.headerView}
                {this.contentHTML}
            </div>
        )
    }

    init() {
        this.uuid = this.props.uuid;
        this.contentHTML = this.props.contentHTML;
        this.headerView = this.props.headerView;
    }
    
    /*override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: .default, reuseIdentifier: reuseIdentifier)
        
        emailHeaderView.view.insetsLayoutMarginsFromSafeArea = false
        
        selectionStyle = .none
        
        let containerView = UIView()
        contentView.addSubview(containerView)
        
        backgroundColor = .clear
        contentView.backgroundColor = .clear
        containerView.backgroundColor = .secondarySystemGroupedBackground
        emailHeaderView.view.backgroundColor = .secondarySystemGroupedBackground
        containerView.layer.cornerRadius = 10
        
        contentView.addSubview(emailView)
        contentView.addSubview(emailHeaderView.view)
        containerView.translatesAutoresizingMaskIntoConstraints = false
        emailView.translatesAutoresizingMaskIntoConstraints = false
        emailHeaderView.view.translatesAutoresizingMaskIntoConstraints = false
        let outerInset: CGFloat = 10
        let innerInset: CGFloat = 10
        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: outerInset),
            containerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: outerInset),
            containerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -outerInset),
            containerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -outerInset),
            emailHeaderView.view.topAnchor.constraint(equalTo: containerView.topAnchor, constant: innerInset),
            emailHeaderView.view.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: innerInset),
            emailHeaderView.view.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -innerInset),
            emailView.topAnchor.constraint(equalTo: emailHeaderView.view.bottomAnchor, constant: 0),
            emailView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: innerInset),
            emailView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -innerInset),
            emailView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor, constant: -innerInset)
        ])
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func prepareForReuse() {
        super.prepareForReuse()
        backgroundColor = .clear
        contentView.backgroundColor = .clear
    }
    
    override func layoutSubviews() {
        //SwiftUI is buggy with safeAreas inside scrollView - this workaround ensures they stay up to date
//        emailHeaderView.additionalSafeAreaInsets = .init(top: 1, left: 0, bottom: 0, right: 0)
//        emailHeaderView.additionalSafeAreaInsets = .zero
        super.layoutSubviews()
    }*/
}
