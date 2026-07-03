from flask import Flask, render_template, request

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    resultado = None
    erro = None

    if request.method == "POST":
        try:
            num1 = float(request.form["num1"])
            num2 = float(request.form["num2"])
            operacao = request.form["operacao"]

            if operacao == "soma":
                resultado = num1 + num2
            elif operacao == "subtracao":
                resultado = num1 - num2
            elif operacao == "multiplicacao":
                resultado = num1 * num2
            elif operacao == "divisao":
                if num2 == 0:
                    erro = "Não é possível dividir por zero."
                else:
                    resultado = num1 / num2

        except ValueError:
            erro = "Digite números válidos."

    return render_template("index.html", resultado=resultado, erro=erro)


if __name__ == "__main__":
    app.run(debug=True)