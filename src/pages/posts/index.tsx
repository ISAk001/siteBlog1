import { GetStaticProps } from 'next';
import {useState} from 'react';

import Head from 'next/head';

import styles from './styles.module.scss';
import Link from 'next/link';

import Image from 'next/image';


import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText} from 'prismic-dom'; 

import { FiChevronLeft, FiChevronsLeft, FiChevronRight, FiChevronsRight} from 'react-icons/fi';

type Post = {
  slug: string;
  title: string;
  cover: string;
  description: string;
  updatedAt: string
}

interface PostsProps{
  posts: Post[];
  page: string,
  totalPage: string
}

export default function Posts({ posts: postsBlog, page, totalPage }: PostsProps){

  const [currentPage, setcurrentPage] = useState(Number(page));
  const [posts, setPosts] = useState(postsBlog || []) ;

  //buscar novos posts
  async function reqPost(pageNumber: number){
    const prismic = getPrismicClient();
    const response = await prismic.query([
      Prismic.predicates.at('document.type', 'post')
    ],{
      orderings: '[document.last_publication_date desc]', //Ordenar pelo mais recente
      fetch: ['post.title', 'post.description', 'post.cover'],
      pageSize: 2,
      page: String(pageNumber)
    })
    
    return response;
  }

  async function navigatePage(pageNumber:number ){
    const response = await reqPost(pageNumber);
    
    if(response.results.length === 0){
      return;
    }
    const getPosts = response.results.map(post => ({
      slug: post.uid ?? '', // Definindo uma string vazia como valor padrão
      title: RichText.asText(post.data.title),
      description: post.data.description.find((content: { type: string }) => content.type === 'paragraph')?.text ?? '',
      cover: post.data.cover.url,
      updatedAt: post.last_publication_date ? new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) : ''
    }));
    
    setcurrentPage(pageNumber);
    setPosts(getPosts);
    

  }

  return(
  <>
  <Head>
    <title>Blog | sujeito programador</title>
  </Head>
  <main className={styles.conteiner}>
    <div className={styles.posts}>
     {posts.map (post => (
      <Link key={post.slug} href={`/posts/${post.slug}`} legacyBehavior>
      <a key={post.slug}>
        <Image 
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mO0YvjfBAADcgG9K6qdIwAAAABJRU5ErkJggg=="
        quality={100}
        height={410}
        width={720}       
        src={post.cover} 
        alt={post.title}/>
        <strong>{post.title}</strong>
        <time>{post.updatedAt}</time>
        <p>{post.description}</p>
      </a>
      </Link>    
     ))}

     <div className={styles.buttonNavigate}>
            { Number(currentPage) >= 2 &&(
              <div>
              <button onClick={ ()=> navigatePage(1) }>
                <FiChevronsLeft size={25} color="#FFF" />
              </button>
              <button onClick={ ()=> navigatePage(Number(currentPage -1)) }>
                <FiChevronLeft size={25} color="#FFF" />
              </button>
            </div>
            )}

            {Number(currentPage) < Number(totalPage) &&(
              <div>
              <button onClick={ ()=> navigatePage(Number(currentPage + 1)) }>
                <FiChevronRight size={25} color="#FFF" />
              </button>
              <button onClick={ ()=> navigatePage(Number(totalPage)) }>
                <FiChevronsRight size={25} color="#FFF" />
              </button>
            </div>
            )}
            
         </div>
       </div>
     </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ], {
    orderings: '[document.last_publication_date desc]', //Ordenar pelo mais recente
    fetch: ['post.title', 'post.description', 'post.cover'],
    pageSize: 2
  })

 // console.log(JSON.stringify(response, null, 2));

 const posts = response.results.map( post => {
  return {
      slug: post.uid,
      title: RichText.asText(post.data.title),
      description: post.data.description.find((content: { type: string }) => content.type === 'paragraph')?.text ?? '',
      cover: post.data.cover.url,
      updatedAt: post.last_publication_date ? new Date(post.last_publication_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) : ''
  }
})

return{
  props:{
    posts,
    page: response.page,
    totalPage: response.total_pages
  },
  revalidate: 60 * 30 // Atualiza a cada 30 minutos.
}
}