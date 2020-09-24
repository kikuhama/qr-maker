const QR = {
    url: "",
    size: 15,
    img: null,

    setSize: function(value) {
        const newSize = Number(value);
        if(newSize) {
            QR.size = newSize;
            QR.make();
        }
        else {
            QR.size = 0;
        }
    },

    setURL: function(value) {
        QR.url = value;
        QR.make();
    },

    make: function() {
        if(QR.url.match(/^https?:\/\//) && QR.size > 0) {
            m.request({
                method: "GET",
                url: "make_qr",
                params: {url: QR.url, size: QR.size},
                responseType: "blob",
            }).then(function(data) {
                if(data) {
                    const reader = new FileReader();
                    reader.addEventListener("load", function() {
                        QR.img = reader.result;
                        m.redraw();
                    }, false);
                    reader.readAsDataURL(data);
                }
                else {
                    QR.img = null;
                }
                QRList.processing = false;
            }).catch(function(err) {
                console.log(err);
            });
        }
        else {
            QR.img = null;
        }
    },
};

const QRList = {
    processing: false,
    data: null,
    
    make: function(file) {
        QRList.processing = true;
        const fd = new FormData();
        fd.append("file", file);

        m.request({
            method: "POST",
            url: "make_qr_from_list",
            body: fd,
            responseType: "blob",
        }).then(function(data) {
            if(data) {
                const reader = new FileReader();
                reader.addEventListener("loadend", function() {
                    QRList.data = reader.result;
                    m.redraw();
                });
                reader.readAsDataURL(data);
            }
            else {
                QRList.data = null;
            }
            QRList.processing = false;
        }).catch(function(err) {
            console.log(err);
        });
    },
};

const HelpTextView = {
    view: function(vnode) {
        return m("small.form-text.text-muted", vnode.children);
    },
};

const QRImgView = {
    view: function(vnode) {
        if(QR.img) {
            return m(".text-center", [
                m("img.qr-img", {src: QR.img}),
                m("br"),
                m("a.btn.btn-sm.btn-primary", {
                    href: QR.img,
                    download: "qr.png",
                }, "保存"),
            ]);
        }
    },
};

const QRFromURLView = {
    view: function(vnode) {
        return m(".card", [
            m("h5.card-header", "URLから作成（個別）"),
            m(".card-body", [
                m(".form-row", [
                    m(".col-8", [
                        m("label[for=url]", "URL"),
                        m("input[type=text]#url.form-control", {
                            value: QR.url,
                            oninput: function(e) {
                                QR.setURL(e.target.value);
                            }}),
                        m(HelpTextView, "QRを作成したいURLを入力してください。"),
                    ]),
                    m(".col-2", [
                        m("label[for=qr-size]", "サイズ"),
                        m(".input-group", [
                            m("input[type=text]#qr-size.form-control", {
                                value: QR.size,
                                oninput: function(e) {
                                    QR.setSize(e.target.value);
                                }}),
                            m(".input-group-append", [
                                m("span.input-group-text", "mm"),
                            ]),
                        ]),
                        m(HelpTextView, "QRのサイズ(mm)を入力してください。"),
                    ]),
                    m(".col", [
                        m(QRImgView),
                    ]),
                ]),
            ]),
        ]);
    },
};

const QRListDownloadView = {
    view: function(vnode) {
        return m("a.btn.btn-primary", {
            href: QRList.data,
            download: "qrlist.zip",
        }, "ダウンロード");
    },
};

const QRFromListView = {
    view: function(vnode) {
        return m(".card.mt-4", [
            m("h5.card-header", "Excelリストから作成"),
            m(".card-body", [
                m(".form-row", [
                    m(".col-8", [
                        m("label[for=file]", "Excelファイル"),
                        m("input[type=file][name=file].form-control-file#file", {
                            disabled: QRList.processing,
                            onchange: function(e) {
                                QRList.make(e.target.files[0]);
                            }}),
                    ]),
                    m(".col", [
                        QRList.processing ? m(".alert.alert-danger", "処理中") : "",
                        QRList.data ? m(QRListDownloadView) : "",
                    ]),
                ]),
            ]),
        ]);
    },
};

const TopPage = {
    view: function(vnode) {
        return m(".container", [
            m(QRFromURLView),
            m(QRFromListView),
        ]);
    },
};

const root = document.getElementById("root");
m.route(root, "/top", {
    "/top": TopPage,
});
