import React, { useMemo, useState } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "../../styles/board.scss";
import CustomToolbar from "./CustomToolbar"; // CustomToolbar 컴포넌트 import
import { Link, useNavigate } from "react-router-dom";
import useCates from "../../hooks/useCates";
import { useSelector } from "react-redux";
import axios from "axios";
import url from "../../config/url";

const Size = Quill.import("formats/size");
Size.whitelist = ["small", "medium", "large", "huge"];
Quill.register(Size, true);
// 폰트를 whitelist에 추가하고 Quill에 등록해준다.
const Font = Quill.import("attributors/class/font");
Font.whitelist = ["buri", "GangwonEduSaeeum"];
Quill.register(Font, true);

const formats = [
  "size",
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "list",
  "bullet",
  "indent",
  "link",
  "image",
  "video",
  "align",
  "color",
  "background",
  "font",
  "table",
];

/*bold , italic 추가 */
let bold = Quill.import("formats/bold");
bold.tagName = "b";
Quill.register(bold, true);

let italic = Quill.import("formats/italic");
italic.tagName = "i";
Quill.register(italic, true);

//🎈img파일  인코딩
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${url.backendUrl}/upload/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log(response);
    return response.data.url; // 서버에서 반환된 이미지 URL
  } catch (error) {
    console.error("Image upload failed:", error);
    throw new Error("Image upload failed");
  }
};

const handleImageUpload = async (file) => {
  const imageUrl = await uploadImage(file);
  return imageUrl;
};

export default function Write() {
  // 카테값 전부 가져옴(배열인 상태)
  const cate1 = useCates();
  // useCates의 두번째 값
  console.log("cate값:" + cate1[1]);

  const [values, setValues] = useState("");
  const authSlice = useSelector((state) => state.authSlice);
  const navigate = useNavigate();

  const [board, setBoard] = useState({
    cate: cate1[1],
    title: "",
    content: "",
    nick: "",
    writer: authSlice.username,
  });

  const changeHandler = (e) => {
    e.preventDefault();
    setBoard({ ...board, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (e) => {
    setBoard({ ...board, cate: e.target.value });
  };

  const submitHandler = (e) => {
    e.preventDefault();

    if (!board.title) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!board.cate || (board.cate !== "daily" && board.cate !== "report")) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    console.log(board);

    // Update content before submitting
    const updatedBoard = { ...board, content: values };

    axios
      .post(
        url.backendUrl + `/board/write`,
        JSON.stringify(updatedBoard), // 데이터를 JSON 문자열로 변환
        {
          headers: {
            Authorization: `Bearer ${authSlice.accessToken}`,
            "Content-Type": "application/json",
          }, // 명시적으로 JSON 형식을 지정
        }
      )
      .then((resp) => {
        console.log(resp.data);
        navigate(`/board/list?cate=${updatedBoard.cate}`);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //툴바의 image 버튼을 클릭하면 파일 선택 창이 열리고, 선택한 파일을 서버에 업로드한 후, 에디터에 이미지를 삽입하는 핸들러 추가
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: "#toolbar", // 커스텀 툴바의 ID
        handlers: {
          image: async function () {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.click();

            input.onchange = async () => {
              const file = input.files[0];
              const range = this.quill.getSelection(true);
              this.quill.setSelection(range.index + 1);

              // Upload the image to the server and get the URL
              const imageUrl = await handleImageUpload(file);

              // Insert the image into the editor
              this.quill.insertEmbed(range.index, "image", imageUrl);
            };
          },
        },
      },
    };
  }, []);

  return (
    <div className="Board">
      <h2>
        {/*카테고리 값에 따라 게시판 제목 변경 */}
        <span>
          {" "}
          {cate1[1] === "notice"
            ? "📌 공지사항"
            : cate1[1] === "daily"
            ? "🌞 일상"
            : cate1[1] === "report"
            ? "🚨 신고합니다"
            : "커뮤니티 글쓰기"}
        </span>{" "}
      </h2>
      <div className="eTop">
        <div className="eCate">
          <select value={board.cate} onChange={handleCategoryChange}>
            <option value="" selected>
              카테고리 선택
            </option>
            <option value="daily">🌞 일상</option>
            <option value="report">🚨 신고합니다</option>
          </select>
        </div>

        <div className="eTitle">
          <input
            type="text"
            name="title"
            value={board.title}
            onChange={changeHandler}
            placeholder="제목을 입력해주세요."
          ></input>
        </div>
      </div>
      <div className="editor">
        <CustomToolbar /> {/* CustomToolbar 컴포넌트를 렌더링 */}
        <ReactQuill
          theme="snow"
          value={values}
          modules={modules}
          formats={formats}
          name="content"
          onChange={(content, delta, source, editor) =>
            setValues(editor.getHTML())
          }
        />
      </div>

      <div className="editBtn">
        <Link to={`/board/list?cate=${cate1[1]}`}>취소</Link>
        <button className="submitBtn" onClick={submitHandler}>
          등록
        </button>
      </div>
    </div>
  );
}
