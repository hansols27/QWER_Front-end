import React, { useState } from "react";
import "@front/ui/notice.css";
import { notice } from "@front/data/noticelist";

import btn_prev from "@front/assets/icons/bg-btn-prev.png";
import btn_next from "@front/assets/icons/bg-btn-next.png";

export default function Notice() {
  const [page, setPage] = useState(1);
  const totalPages = 62;

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="container">
      {/* Side */}
      <div id="side">
        <div className="side2">
          06
          <span className="s_line"></span>
          NOTICE
        </div>
      </div>

      {/* Main */}
      <div className="cont notice">
        {/* Left */}
        <div className="n_left">
          <div className="title n_tt">NOTICE</div>
        </div>

        {/* Right */}
        <div className="n_right">
          {/* Notice List */}
          <div className="noticeList">
            <ul>
              {notice.map((notice) => (
                <li key={notice.id}>
                  <a href={notice.link}>
                    <p className="cate">{notice.category}</p>
                    <p className="nc_in">
                      <span className="tit">{notice.title}</span>
                      <span className="date">{notice.date}</span>
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          <div className="page-btn-box nt_bt">
            <button
              type="button"
              className="prev-btn"
              onClick={handlePrev}
              disabled={page === 1}
            >
              <img alt="이전" src={btn_prev} />
              이전
            </button>

            <span className="page-number">
              <strong>{page}</strong> / <em>{totalPages}</em>
            </span>

            <button
              type="button"
              className="next-btn"
              onClick={handleNext}
              disabled={page === totalPages}
            >
              <img alt="이후" src={btn_next} />
              이후
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
