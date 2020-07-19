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
    if(noGlobal) throw new Error('unsupports env.')

    const RAW_DATA_ETAG_KEY = 'article_issues_etag'
    const RAW_DATA_KEY = 'articles_issues'
    const RAW_DATA_METADATE = 'articles_issues_metadata'
    // const USER_REPO = 'xuya227939/LiuJiang-Blog'
    const USER_REPO = 'tivizi/tivizi'
    const RAW_DATA_VALID_SECONDS = 120
    const DEF_AVATAR_DATA = 'data:image/png;base64,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'
    const TIPS_AREA = '<div><span id="loadding"><svg t="1595122648400" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2142"><path d="M204.8 204.8m-204.8 0a204.8 204.8 0 1 0 409.6 0 204.8 204.8 0 1 0-409.6 0Z" fill="#EBF2FC" p-id="2143"></path><path d="M819.2 204.8m-204.8 0a204.8 204.8 0 1 0 409.6 0 204.8 204.8 0 1 0-409.6 0Z" fill="#B5D2F3" p-id="2144"></path><path d="M819.2 819.2m-204.8 0a204.8 204.8 0 1 0 409.6 0 204.8 204.8 0 1 0-409.6 0Z" fill="#7FB0EA" p-id="2145"></path><path d="M204.8 819.2m-204.8 0a204.8 204.8 0 1 0 409.6 0 204.8 204.8 0 1 0-409.6 0Z" fill="#4A90E2" p-id="2146"></path></svg></span><span id="load_success"><svg t="1595123306396" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1192"><path d="M512 64c247.424 0 448 200.576 448 448S759.424 960 512 960 64 759.424 64 512 264.576 64 512 64z m298.667 224L437.333 586.667l-224-74.667 224 224 373.334-448z" p-id="1193" fill="#2aa515"></path></svg></span></div>'
    const BEGION_TIME = '2000-12-12T12:12:12Z'
    if(!localStorage.getItem(RAW_DATA_METADATE)) {
        localStorage.setItem(RAW_DATA_METADATE, JSON.stringify({
            uptime: BEGION_TIME,
            total: 0
        }))
    }

    window.showPage = 1

    function initTipsComponent() {
        document.body.innerHTML += TIPS_AREA
    }
    function loadtips() {
       document.querySelector('#loadding').style.display = 'block'
       document.querySelector('#load_success').style.display = 'none' 
    }

    function closetips() {
        document.querySelector('#loadding').style.display = 'none'
        document.querySelector('#load_success').style.display = 'block'
        let timer = setTimeout(() => {
            clearTimeout(timer)
            document.querySelector('#load_success').style.display = 'none'
        }, 2000) 
    }

    function fetchAvatar(url, imgId) {
        fetch('https://cors-anywhere.herokuapp.com/' + url).then(resp => resp.blob()).then(imgBlob => document.querySelector('#' + imgId).src=URL.createObjectURL(imgBlob)).catch(e => console.log(e))
    }

    function fetchArticlesToStorage() {
        return new Promise((resolve, reject) => {
            let articles_raw = localStorage.getItem(RAW_DATA_KEY)
            let etag = localStorage.getItem(RAW_DATA_ETAG_KEY)
            let queryParams = '?per_page=120'
            let metadata = JSON.parse(localStorage.getItem(RAW_DATA_METADATE))
            queryParams += ('&since=' + metadata.uptime)

            let articles = {}
            if(articles_raw) {
                articles = JSON.parse(articles_raw)
            }
            
            fetch(new Request('https://api.github.com/repos/' + USER_REPO + '/issues' + queryParams, {
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
                localStorage.setItem(RAW_DATA_ETAG_KEY, etdg)
                return resp.json()
            }).
            then(json => {
                json.forEach(issue => {
                    articles[issue.number] = issue
                })
                localStorage.setItem(RAW_DATA_KEY, JSON.stringify(articles))
                metadata.total += json.length
                metadata.uptime = new Date().toISOString()
                localStorage.setItem(RAW_DATA_METADATE, JSON.stringify(metadata))
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
        loadtips()
        let articles_raw = localStorage.getItem(RAW_DATA_KEY)
        let metadata = JSON.parse(localStorage.getItem(RAW_DATA_METADATE))
        if(articles_raw) {
            let articles = JSON.parse(articles_raw)
            renderArticlesFromArticleList(articles, metadata, container_selector)
            closetips()
        } else {
            closetips()
            console.log('non exists any articles')
        }
    }

    function resetContainer(container_selector) {
        let container = document.querySelector(container_selector)
        container.innerHTML = ''
        let ul = document.createElement('ul')
        container.appendChild(ul)
    }

    function renderArticlesFromArticleList(articles, metadata, container_selector) {
        let ul = document.querySelector(container_selector).querySelector('ul')

        let pageSize = 20


        let keys = Object.keys(articles)
        
        let stopIndex = (window.showPage -1) * ( -pageSize)
        let startIndex = stopIndex-pageSize+1
        
        if(-startIndex > metadata.total) {
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
        reply.innerHTML = '评论' + issue.comments
        reply.href = '/articles#' + issue.number

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

        let title = document.createElement('div')
        title.className = 'title'
        title.innerHTML += issue.title
        title.setAttribute('onclick', "showContent(this)")


        let li = document.createElement('li')

        li.appendChild(title)
        li.appendChild(author)

        ul.appendChild(li)

        fetchAvatar(issue.user.avatar_url, avatarImg.id)
    }

    window.loadtips = loadtips
    window.closetips = closetips
    window.fetchArticlesToStorage = fetchArticlesToStorage
    window.renderArticleFromStorage = renderArticleFromStorage
    window.renderArticlesFromArticleList = renderArticlesFromArticleList
    window.initTipsComponent = initTipsComponent
    window.resetContainer = resetContainer
})
