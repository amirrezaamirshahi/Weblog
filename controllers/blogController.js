const Yup = require("yup");
// const captchapng = require("captchapng");
const Blog = require("../models/Blog");
const { sendEmail } = require("../utils/mailer");

let CAPTCHA_NUM;

exports.getIndex = async (req, res, next) => {
    try {
        const numberOfPosts = await Blog.find({
            status: "public",
        }).countDocuments();

        const posts = await Blog.find({ status: "public" }).sort({
            createdAt: "desc",
        });

        if (!posts) {
            const error = new Error("هیچ پستی در پایگاه داده ثبت نشده است");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ posts, total: numberOfPosts });
    } catch (err) {
        next(err);
    }
};

exports.getSinglePost = async (req, res, next) => {
    try {
        const post = await Blog.findOne({ _id: req.params.id }).populate(
            "user"
        );

        if (!post) {
            const error = new Error("پستی با این شناسه یافت نشد");
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ post });
    } catch (err) {
        next(err);
    }
};

exports.handleContactPage = async (req, res, next) => {
    const errorArr = [];

    const { fullname, email, message } = req.body;

    const schema = Yup.object().shape({
        fullname: Yup.string().required("نام و نام خانوادگی الزامی می باشد"),
        email: Yup.string()
            .email("آدرس ایمیل صحیح نیست")
            .required("آدرس ایمیل الزامی می باشد"),
        message: Yup.string().required("پیام اصلی الزامی می باشد"),
    });

    try {
        await schema.validate(req.body, { abortEarly: false });
        // sendEmail(
        //     email,
        //     fullname,
        //     "پیام از طرف وبلاگ",
        //     `${message} <br/> ایمیل کاربر : ${email}`
        // );

        res.status(200).json({ message: "پیام شما با موفقیت ارسال شد" });
    } catch (err) {
        err.inner.forEach((e) => {
            errorArr.push({
                name: e.path,
                message: e.message,
            });
        });

        const error = new Error("خطا در اعتبار سنجی");
        error.statusCode = 422;
        error.data = errorArr;

        next(error);
    }
};

