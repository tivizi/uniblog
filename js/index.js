((global, factory) => {
    if (!global.document) {
        throw new Error('this script only can run inside brower!')
    }
    if (!global.pages) {
        throw new Error('this script require page.js!')
    }
    global.index = factory(global.document, global.backend, global.pages)
})(this, (document, backend, pages) => {
    return {
        config: {
            container_selector: '#container',
            page_tips_selector: '#page-tips'
        },
        resetContainer: function() {
            document.showPage = 1
            let container = document.querySelector(this.config.container_selector)
            container.innerHTML = ''
            let ul = window.document.createElement('ul')
            container.appendChild(ul)
            pages.init()
        },

        renderArticle: async function (articles) {
            let ctx = await articlesStorage.context()
            let ul = document.querySelector(this.config.container_selector).querySelector('ul')
            articles.forEach(issue => {
                let avatarImg = document.createElement('img')
                avatarImg.id = 'issue-' + issue.id
                avatarImg.src = pages.DEF_AVATAR_DATA
                avatarImg.alt = issue.user.login
                avatarImg.width = 22
                avatarImg.height = 22

                let avatarLink = document.createElement('a')
                avatarLink.href = 'https://github.com/' + issue.user.login
                avatarLink.title = issue.user.login
                avatarLink.className = 'avatar'
                avatarLink.appendChild(avatarImg)

                let reply = window.document.createElement('a')
                reply.className = 'reply'
                reply.innerHTML = issue.comments
                reply.href = '/articles.html#!' + issue.number

                let ops = window.document.createElement('div')
                ops.className = 'ops'
                for (let j in issue.labels) {
                    let label = issue.labels[j]
                    let labelLink = window.document.createElement('a')
                    labelLink.href = 'https://github.com/' + ctx.namespace + '/labels/' + label.name
                    labelLink.innerHTML = '#' + label.name
                    ops.appendChild(labelLink)
                }
                ops.appendChild(reply)

                let author = window.document.createElement('div')
                author.appendChild(avatarLink)
                author.className = 'author'
                author.innerHTML += new Date(Date.parse(issue.created_at)).toLocaleDateString()
                author.appendChild(ops)

                let title = window.document.createElement('a')
                title.className = 'title'
                title.innerHTML += issue.title
                title.href = 'articles.html#!' + issue.number

                let li = window.document.createElement('li')

                li.appendChild(title)
                li.appendChild(author)

                ul.appendChild(li)

                pages.fetchAvatar(issue.user.avatar_url, avatarImg.id)
            })
        },
        renderWithShowPage: async function () {
            pages.loadtips()
            try {
                let articles = await backend.loadByPage(document.showPage)
                await this.renderArticle(articles)
                document.showPage++
            } catch(e) {
                pages.showPageTips(this.config.page_tips_selector, e.message)
            }
            pages.closetips()
        },
        updateArticlesInBackground: async function() {
            pages.loadtips()
            pages.showPageTips(this.config.page_tips_selector, '')
            backend.flushNewestArticles().then( () => {
                this.resetContainer()
                this.renderWithShowPage()
            }).finally( () => pages.closetips())
        }
    }
})