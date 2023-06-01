// React Markdown
import React, { useState, useEffect, useRef } from "react";

// JSX Elements
import { UserInfo, UserInfoMobile } from "../../containers";
import { Badge, LoadingMessage, NewsLetter, Tags } from "../../components";

// JS
import { getArticleFileURL, likeArticle } from "../../js/firebaseFunctions";

// CSS
import "./article.css";

// Icons
import { FiMessageCircle, FiSkipForward } from "react-icons/fi";
import {
  AiFillDislike,
  AiFillLike,
  AiOutlineDislike,
  AiOutlineLike,
} from "react-icons/ai";
import { auth } from "../../config/firebase";

// Markdown
import ReactMarkdown from "react-markdown";
import { Buffer } from "buffer";
import matter from "gray-matter";

const Article = ({ article, setArticleRoutesInfo }) => {
  global.Buffer = global.Buffer || Buffer;

  const maxTags = 4;

  const [loading, setLoading] = useState(true);
  const [animationSkipped, setAnimationSkipped] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [markdown, setMarkdown] = useState("");

  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const cursorRef = useRef(null);

  useEffect(() => {
    function typeText() {
      let i = -1;
      let timer = setInterval(() => {
        i++;
        if (i === markdown.content.length - 1) clearInterval(timer);
        setText((prev) => prev + markdown.content[i]);
      }, 0.01);

      setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 500);
    }

    if (!loading && !animationSkipped) {
      typeText();
    }
  }, [loading, markdown.content, animationSkipped]);

  useEffect(() => {
    const currentUserID = auth.currentUser.uid;

    getArticleFileURL(article.articleID).then((url) => {
      fetch(url)
        .then((response) => {
          if (response.ok) {
            return response.text();
          } else {
            throw new Error("Error: " + response.status);
          }
        })
        .then((markdownText) => {
          const content = matter(markdownText);
          setMarkdown(content);
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(() => {
          setLoading(false);
        });
    });

    if (article.likes.includes(currentUserID)) {
      setReaction(true);
    } else if (article.dislikes.includes(currentUserID)) {
      setReaction(false);
    } else {
      setReaction(null);
    }
  }, [article]);

  const formatTimestamp = (seconds) => {
    const date = new Date(seconds * 1000);
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return date.toLocaleString(undefined, options);
  };

  const handleLike = async () => {
    let newReaction = null;

    if (reaction !== true) {
      newReaction = true;
    }

    try {
      await likeArticle(article.articleID, newReaction, newReaction === null);
      setReaction(newReaction);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDislike = async () => {
    let newReaction = null;

    if (reaction !== false) {
      newReaction = false;
    }

    try {
      await likeArticle(article.articleID, newReaction, newReaction === null);
      setReaction(newReaction);
    } catch (error) {
      console.error(error);
    }
  };

  function skipAnimation() {
    setText(markdown.content);
    setAnimationSkipped(true);
  }

  return (
    <main
      className={`h-full flex justify-center text-white md:pl-[260px] ${
        loading ? "h-screen flex justify-center items-center" : ""
      }`}
    >
      {loading ? (
        <LoadingMessage message="Loading Article" />
      ) : (
        <div className="w-[1000px] xl:mt-10 2xl:mt-[100px]">
          <header className="relative border-b-[1px] p-5 mt-5 md:mt-0">
            <ul className="absolute bottom-5 right-10 flex gap-5">
              <li>
                <button
                  className="flex items-center gap-1"
                  onClick={handleLike}
                >
                  {reaction === true ? <AiFillLike /> : <AiOutlineLike />}
                  {article.likeCount}
                </button>
              </li>
              <li>
                <button
                  className="flex items-center gap-1"
                  onClick={handleDislike}
                >
                  {reaction === false ? (
                    <AiFillDislike />
                  ) : (
                    <AiOutlineDislike />
                  )}
                  {article.dislikeCount}
                </button>
              </li>
              <li className="flex items-center gap-1">
                <FiMessageCircle />
                {article.comments.length}
              </li>
            </ul>
            <div>
              <div className="flex flex-col">
                <div className="mb-1"><Tags tags={article.tags} maxTags={maxTags} /></div>
                
                <h1 className="text-3xl font-bold">{article.title}</h1>
                <p className="text-sm font-thin text-gpt-50">
                  {article.timestamp
                    ? formatTimestamp(article.timestamp.seconds)
                    : null}
                </p>
              </div>
            </div>
          </header>
          <div className="flex justify-between flex-col lg:flex-row lg:gap-10 p-5">
            <UserInfoMobile authorID={article.authorID} />
            <article className="lg:text-justify px-1 lg:px-0">
              <React.Fragment>
                <ReactMarkdown className="article">{text}</ReactMarkdown>
                <div className="flex md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 fixed bottom-10 left-1/2 transform translate-x-[-50%]">
                  <button
                    className="btn relative border-[1px] border-gpt-50/50 p-1 px-3 bg-gpt-300 hover:bg-[#41414b] shadow-lg rounded-sm"
                    onClick={() => skipAnimation()}
                  >
                    <div className="flex w-full gap-2 items-center justify-center">
                      <FiSkipForward /> Skip animation
                    </div>
                  </button>
                </div>
              </React.Fragment>
            </article>
            <aside className="flex-col gap-3 sticky top-7 h-full hidden lg:flex">
              {article.authorID ? (
                <UserInfo
                  authorID={article.authorID}
                  setArticleRoutesInfo={setArticleRoutesInfo}
                />
              ) : null}
              <NewsLetter />
            </aside>
          </div>
        </div>
      )}
    </main>
  );
};

export default Article;
