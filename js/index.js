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
    if(noGlobal) throw new Error('invalid env.')

    const RAW_DATA_ETAG_KEY = 'article_issues_etag'
    const RAW_DATA_KEY = 'articles_issues'
    const RAW_DATA_METADATE = 'articles_issues_metadata'
    const BEGION_TIME = '2000-12-12T12:12:12Z'
    if(!window.localStorage.getItem(RAW_DATA_METADATE)) {
        window.localStorage.setItem(RAW_DATA_METADATE, JSON.stringify({
            uptime: BEGION_TIME,
            total: 0
        }))
    }

    window.showPage = 1

    function fetchArticlesToStorage() {
        return new Promise((resolve, reject) => {
            let articles_raw = window.localStorage.getItem(RAW_DATA_KEY)
            let etag = window.localStorage.getItem(RAW_DATA_ETAG_KEY)
            let queryParams = '?per_page=120'
            let metadata = JSON.parse(window.localStorage.getItem(RAW_DATA_METADATE))
            queryParams += ('&since=' + metadata.uptime)

            let articles = {}
            if(articles_raw) {
                articles = JSON.parse(articles_raw)
            }
            
            fetch(new Request('https://api.github.com/repos/' + window.USER_REPO + '/issues' + queryParams, {
                method: 'GET',
                headers: {
                    'If-None-Match': etag
                }
            })).
            then(resp => {
                if(resp.status == 304) {
                    resolve({
                        data: articles,
                        metadata: metadata
                    })
                    Promise.reject('304 not modified')
                }
                return resp
            }).
            then(resp => {
                let etdg = resp.headers.get('etag')
                console.log(RAW_DATA_ETAG_KEY + ': ' + etdg)
                window.localStorage.setItem(RAW_DATA_ETAG_KEY, etdg)
                return resp.json()
            }).
            then(json => {
                json.forEach(issue => {
                    articles[issue.number] = issue
                })
                if(json.length > 0) {
                    window.localStorage.setItem(RAW_DATA_KEY, JSON.stringify(articles))
                    metadata.total += json.length
                    metadata.uptime = new Date().toISOString()
                    window.localStorage.setItem(RAW_DATA_METADATE, JSON.stringify(metadata))
                }
                resolve({
                    data: articles,
                    metadata: metadata
                })
            }).
            catch(e => {
                e.data = articles
                e.metadata = metadata
                reject(e)
            })
        })
    }

    function renderArticleFromStorage(container_selector) {
        if(!container_selector) throw 'container_selector is required!'
        window.loadtips()
        let articles_raw = window.localStorage.getItem(RAW_DATA_KEY)
        let metadata = JSON.parse(window.localStorage.getItem(RAW_DATA_METADATE))
        if(articles_raw) {
            let articles = JSON.parse(articles_raw)
            renderArticlesFromArticleList(articles, metadata, container_selector)
            window.closetips()
        } else {
            window.closetips()
            console.log('non exists any articles')
        }
    }

    function resetContainer(container_selector) {
        window.showPage = 1
        let container = window.document.querySelector(container_selector)
        container.innerHTML = ''
        let ul = window.document.createElement('ul')
        container.appendChild(ul)
    }

    function renderArticlesFromArticleList(articles, metadata, container_selector) {
        let ul = window.document.querySelector(container_selector).querySelector('ul')

        let pageSize = 20


        let keys = Object.keys(articles)
        
        let stopIndex = (window.showPage -1) * ( -pageSize)
        let startIndex = stopIndex-pageSize+1
        startIndex = -startIndex>metadata.total ? -metadata.total : startIndex
        
        if(-stopIndex > metadata.total) {
            console.log('non more')
            return
        }

        let rangeKeys = keys.slice(startIndex, stopIndex == 0? -1 : stopIndex).reverse()
        console.debug(keys, startIndex, stopIndex, rangeKeys)
        if(stopIndex == 0) {
            renderArticle(articles[keys[keys.length-1]], ul)
        }
        for(i in rangeKeys) {
            renderArticle(articles[rangeKeys[i]], ul)
        }
        window.showPage++
    }

    function renderArticle(issue, ul) {
        let avatarImg = window.document.createElement('img')
        avatarImg.id = 'issue-' + issue.id
        avatarImg.src = window.DEF_AVATAR_DATA
        avatarImg.alt = issue.user.login
        avatarImg.width = 22
        avatarImg.height = 22

        let avatarLink = window.document.createElement('a')
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
            labelLink.href = 'https://github.com/' + USER_REPO + '/labels/' + label.name
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

        window.fetchAvatar(issue.user.avatar_url, avatarImg.id)
    }

    window.fetchArticlesToStorage = fetchArticlesToStorage
    window.renderArticleFromStorage = renderArticleFromStorage
    window.renderArticlesFromArticleList = renderArticlesFromArticleList
    window.resetContainer = resetContainer

})