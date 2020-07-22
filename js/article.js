((global, factory) => {
    if (!global.document) {
        throw new Error('this script only can run inside brower!')
    }
    if (!global.pages) {
        throw new Error('this script require page.js!')
    }
    global.article = factory(global, global.document, global.backend, global.pages)
})(this, (global, document, backend, pages) => {
    return {
        config: {
            container_selector: '#container',
            page_tips_selector: '#page-tips'
        },
        renderArticle: async function(number) {
            let issue = await backend.loadArticle(number)
            if (!issue) throw new Error('Issue not found!')
            document.title = issue.title + ' - ' + backend.config.site_name

            let ctx = await articlesStorage.context(number)

            let avatarImg = window.document.createElement('img')
            avatarImg.id = 'issue-' + issue.id
            avatarImg.src = pages.DEF_AVATAR_DATA
            avatarImg.alt = issue.user.login
            avatarImg.width = 22
            avatarImg.height = 22
    
            let avatarLink = window.document.createElement('a')
            avatarLink.href = 'https://github.com/' + issue.user.login
            avatarLink.title = issue.user.login
            avatarLink.className = 'avatar'
            avatarLink.appendChild(avatarImg)
    
            let ops = window.document.createElement('div')
            ops.className = 'ops'
            for (let j in issue.labels) {
                let label = issue.labels[j]
                let labelLink = window.document.createElement('a')
                labelLink.href = 'https://github.com/' + ctx.namespace + '/labels/' + label.name
                labelLink.innerHTML = '#' + label.name
                ops.appendChild(labelLink)
            }
    
            let author = window.document.createElement('div')
            author.appendChild(avatarLink)
            author.className = 'author'
            author.innerHTML += new Date(Date.parse(issue.created_at)).toLocaleDateString()
            author.appendChild(ops)
    
            let title = window.document.createElement('a')
            title.className = 'title'
            title.innerHTML += issue.title
            title.href = 'articles.html#!' + issue.number
    
            let div = window.document.createElement('div')
    
            div.appendChild(title)
            div.appendChild(author)
            div.appendChild(window.document.createElement('br'))
    
            let content = window.document.createElement('div')
            content.className = 'content'
            content.innerHTML = marked(issue.body)
    
            let container = window.document.querySelector(this.config.container_selector)
            container.innerHTML = ''
    
            container.appendChild(div)
            container.appendChild(content)
    
            pages.fetchAvatar(issue.user.avatar_url, avatarImg.id)
        },
        updateArticleInBackground: async function(number) {
            pages.loadtips()

            backend.flushNewestArticle(number)
                .then( () => { 
                    this.renderArticle(number)
                    this.showPageTips('- the end -')
                })
                .catch( e => {
                    if(e.code == 404 ) {
                        article.showPageTips('- not found -')
                        return
                    }
                    article.showPageTips('- the end -')
                    throw e
                })
                .finally(() => {
                    pages.closetips()
                })
        },
        showPageTips: function(tips) {
            pages.showPageTips(this.config.page_tips_selector, tips)
        }
    }
})