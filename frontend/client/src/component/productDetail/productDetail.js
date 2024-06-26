// ProductDetail.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import style from "./productDetail.module.css";
import FeedCard from "../suggestcard/FeedCard";
import { useNavigate } from "react-router-dom";
// import products from "../../data/products";
import {toast, Toaster} from "sonner";
const ProductDetail = () => {
  const { productId } = useParams();
  const product_list = [productId];
  const [item, setproduct] = useState({});
  const [seller, setseller] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    const getproduct = async () => {
      const resp = await fetch(
        process.env.REACT_APP_URL_PRODUCT + "/getproduct/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ products: product_list, type: "productDetail" }),
        }
      );
      const data = await resp.json();
      const sellerinf = data.finalResult.sellerinfo.seller;
      const product = data.finalResult.result;
      setproduct(product);
      setseller(sellerinf);
    };
    getproduct();
  }, []);

  const handlebuynow = async (e) => {
    e.preventDefault();
    const data = {
      product_id: item._id,
      seller_id: item.newProduct.seller_id,
      amount: 1,
      product_price: item.newProduct.price,
    };
    try {
      const resp = await fetch(
        process.env.REACT_APP_URL_AUTHENTICATION + "/addCart",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      if (resp.status == 201) {
        navigate("/payment");
      } else if (resp.status == 401) {
        navigate("/signin");
      }
    } catch (error) {
      toast.error("Something went wrong.");
      console.log(error);
    }
  };

  return (
    <>
    <Toaster richColors position="top-center"/>
      {item.newProduct ? (
        <div className={style.container}>
          <div className={style.header}>
            <h1>{item.newProduct.name}</h1>
          </div>

          <div className={style.productDetails}>
            <div className={style.imginfo}>
              <img
                src={
                  "https://res.cloudinary.com/dt0mkdvqx/image/upload/f_auto,q_auto/v1/product_images/" +
                  item._id
                }
                alt={item.newProduct.name}
              />
            </div>
            <div className={style.proinfo}>
              <div className={style.protag}>Name:</div>
              <div className={style.provalue}>{item.newProduct.name}</div>
              <div className={style.protag}>Price: </div>
              <div className={style.provalue}>{item.newProduct.price}</div>
              <div className={style.protag}>Stock:</div>
              <div className={style.provalue}> {item.newProduct.stock}</div>
            </div>
            <div className={style.description}>
              <div className={style.protag}>Product Categories</div>
              <div className={style.desvalue}>{item.newProduct.tags}</div>
            </div>
            <div className={style.description}>
              <div className={style.protag}>Description:</div>
              <div className={style.desvalue}>
                {item.newProduct.description}
              </div>
            </div>
            <div className={style.description}>
              <div className={style.protag}>specification:</div>
              <div className={style.desvalue}>
                {item.newProduct.specification}
              </div>
            </div>

            <div className={style.proinfo}>
              <div className={style.protag}>Seller Name:</div>
              <div className={style.provalue}>{seller.name}</div>
              <button>Chat with Seller</button>
            </div>
            <div className={style.description}>
              <div className={style.protag}> Product from Seller</div>
              <div className={style.sellerData}>
                {item.sellerData.map((product) => (
                  <FeedCard product={product} key={product._id}/>
                ))}
              </div>
            </div>
            <div className={style.description}>
              <div className={style.protag}>Similar Product</div>
              <div className={style.sellerData}>
                {item.tagData.map((product) => (
                  <FeedCard product={product} key={product._id}/>
                ))}
              </div>
            </div>
            <div className={style.privacyPolicy}>
              By signing up, you agree to our <a href="#">Privacy Policy</a> and{" "}
              <a href="#">Terms of Service</a>
            </div>
          </div>
          <div className={style.footer}>
            <button onClick={handlebuynow}>Buy Now</button>
          </div>
        </div>
      ) : (
        "Loading..."
      )}
    </>
  );
};

export default ProductDetail;
/*
// ProductPage.js
import React from "react";
import styles from "./Cart.module.css";

const ProductPage = () => {
  const [selectedColor, setSelectedColor] = React.useState("black");
  const [selectedSize, setSelectedSize] = React.useState("M");

  const handleColorClick = (color) => {
    setSelectedColor(color);
  };

  const handleSizeClick = (size) => {
    setSelectedSize(size);
  };

  return (
    <div className={styles.productPage}>
      <div className={styles.productPageHeader}>
        <div className={styles.productPageTitle}>Product Title</div>
        <div className={styles.productPageSubtitle}>Product Subtitle</div>
      </div>
      <div className={styles.productPageContent}>
        <img
          src="https://via.placeholder.com/600x400.png?text=Product+Image"
          alt="Product"
          className={styles.productPageImage}
        />
        <div className={styles.productPageDetails}>
          <div className={styles.productPageDetailsName}>Product Name</div>
          <div className={styles.productPageDetailsPrice}>$99.99</div>
          <div className={styles.productPageDetailsDescription}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non
            risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing
            nec, ultricies sed, dolor.
          </div>
          <div className={styles.productPageDetailsColorSize}>
            <div className={styles.productPageDetailsColorSizeLabel}>
              Color:
            </div>
            <div
              className={`${styles.productPageDetailsColorSizeOption} ${
                selectedColor === "black"
                  ? styles.productPageDetailsColorSizeOptionActive
                  : styles.productPageDetailsColorSizeOptionInactive
              }`}
              style={{ backgroundColor: "black" }}
              onClick={() => handleColorClick("black")}
            ></div>
            <div
              className={`${styles.productPageDetailsColorSizeOption} ${
                selectedColor === "white"
                  ? styles.productPageDetailsColorSizeOptionActive
                  : styles.productPageDetailsColorSizeOptionInactive
              }`}
              style={{ backgroundColor: "white" }}
              onClick={() => handleColorClick("white")}
            ></div>
          </div>
          <div className={styles.productPageDetailsColorSize}>
            <div className={styles.productPageDetailsColorSizeLabel}>Size:</div>
            <div
              className={`${styles.productPageDetailsColorSizeOption} ${
                selectedSize === "S"
                  ? styles.productPageDetailsColorSizeOptionActive
                  : styles.productPageDetailsColorSizeOptionInactive
              }`}
              onClick={() => handleSizeClick("S")}
            >
              S
            </div>
            <div
              className={`${styles.productPageDetailsColorSizeOption} ${
                selectedSize === "M"
                  ? styles.productPageDetailsColorSizeOptionActive
                  : styles.productPageDetailsColorSizeOptionInactive
              }`}
              onClick={() => handleSizeClick("M")}
            >
              M
            </div>
            <div
              className={`${styles.productPageDetailsColorSizeOption} ${
                selectedSize === "L"
                  ? styles.productPageDetailsColorSizeOptionActive
                  : styles.productPageDetailsColorSizeOptionInactive
              }`}
              onClick={() => handleSizeClick("L")}
            >
              L
            </div>
          </div>
          <div className={styles.productPageActions}>
            <div className={styles.productPageActionsButton} onClick={() => {}}>
              Add to Cart
            </div>
            <div className={styles.productPageActionsButton} onClick={() => {}}>
              Buy Now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;

*/
