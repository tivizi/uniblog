( function( global, factory ) {
	"use strict";
	if ( typeof module === "object" && typeof module.exports === "object" ) {
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "UNI-Blog requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {
    if (noGlobal) throw new Error('unsupports env.')
    
    window.onhashchange = () => location.reload(true)

    window.renderFromStorage = (id, container_selector) => {
        if (!container_selector) throw new Error('container_selector is required!')
        window.loadtips()
        let articles_raw = localStorage.getItem(RAW_DATA_KEY)
        if(!articles_raw) {
            console.warn('non data.')
            return
        }
        let article = JSON.parse(articles_raw)[id]
        if(!article) {
            console.warn('non this article: ', id)
            return
        }
        renderArticle(article,container_selector)
        closetips()
    }

    window.renderArticle = (issue, container_selector) => {
        document.title = issue.title + ' - ' + document.title
        let avatarImg = document.createElement('img')
        avatarImg.id = 'issue-' + issue.id
        avatarImg.src = DEF_AVATAR_DATA
        avatarImg.alt = issue.user.login
        avatarImg.width = 22
        avatarImg.height = 22

        let avatarLink = document.createElement('a')
        avatarLink.href = 'https://github.com/' + issue.user.login
        avatarLink.title = issue.user.login
        avatarLink.className = 'avatar'
        avatarLink.appendChild(avatarImg)

        let reply = document.createElement('a')
        reply.className = 'reply'
        reply.innerHTML = issue.comments
        reply.href = '/articles.html#!' + issue.number

        let ops = document.createElement('div')
        ops.className = 'ops'
        for (let j in issue.labels) {
            let label = issue.labels[j]
            let labelLink = document.createElement('a')
            labelLink.href = 'https://github.com/' + USER_REPO + '/labels/' + label.name
            labelLink.innerHTML = '#' + label.name
            ops.appendChild(labelLink)
        }
        ops.appendChild(reply)

        let author = document.createElement('div')
        author.appendChild(avatarLink)
        author.className = 'author'
        author.innerHTML += new Date(Date.parse(issue.created_at)).toLocaleDateString()
        author.appendChild(ops)

        let title = document.createElement('a')
        title.className = 'title'
        title.innerHTML += issue.title
        title.href = 'articles.html#!1'

        let div = document.createElement('div')

        div.appendChild(title)
        div.appendChild(author)
        div.appendChild(document.createElement('br'))

        let content = document.createElement('div')
        content.className = 'content'
        content.innerHTML = marked(issue.body)

        let container = document.querySelector(container_selector)
        container.innerHTML = ''

        container.appendChild(div)
        container.appendChild(content)

        window.fetchAvatar(issue.user.avatar_url, avatarImg.id)
    } 
})